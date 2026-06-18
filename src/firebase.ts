import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  disableNetwork,
  enableNetwork,
  getDocFromServer,
  terminate,
  setLogLevel
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";
import { Message } from "./types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Silence internal Firestore SDK console warning/error streams to prevent repetitious quota-exhausted logs
setLogLevel("silent");

// Initialize Cloud Firestore and export it referencing the database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export let isDbTerminated = false;

// Gracefully shut down Firestore to completely stop any background write retry loops in the SDK
export async function shutdownFirestoreDueToQuota(errMsg: string = "Quota limit exceeded", operationType: string = "write", path: string | null = null) {
  if (typeof window === "undefined") return;
  
  if (isDbTerminated) return;
  
  isDbTerminated = true;
  localStorage.setItem("jarvis_firestore_quota_exceeded", "true");
  
  try {
    // Terminate stops all active connections, background sync tasks, and listeners
    await terminate(db);
    console.warn("Firestore instance successfully terminated due to write/read quota exhaustion. Clean local core fallback mode engaged.");
  } catch (err) {
    console.warn("Graceful Firestore instance termination yielded:", err);
  }

  // Dispatch custom global event so that React can reactively adjust state UI
  window.dispatchEvent(new CustomEvent("firestore-quota-exceeded", {
    detail: { errMsg, operationType, path }
  }));
}

// Validate connection and detect server-side quota exhaustion on boot
async function validateFirestoreConnection() {
  if (typeof window === "undefined") return;
  
  if (localStorage.getItem("jarvis_firestore_quota_exceeded") === "true") {
    await shutdownFirestoreDueToQuota("Previously detected Firestore quota exceeded on boot", "init", "operators/boot");
    return;
  }

  try {
    const dummyRef = doc(db, "operators", "test_connection_dummy_id_probe");
    await getDocFromServer(dummyRef);
    console.log("Firestore connection test: success. Online operations available.");
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const lowerMsg = errMsg.toLowerCase();
    const isQuota = 
      lowerMsg.includes("quota") || 
      lowerMsg.includes("exhausted") || 
      lowerMsg.includes("resource-exhausted") || 
      lowerMsg.includes("billing") ||
      lowerMsg.includes("resource_exhausted") ||
      lowerMsg.includes("capacity") ||
      lowerMsg.includes("exceeded") ||
      lowerMsg.includes("limit");
      
    if (isQuota) {
      console.warn("Firestore connection check detected quota exhaustion:", errMsg);
      await shutdownFirestoreDueToQuota(errMsg, "get", "operators/test_connection_dummy_id_probe");
    } else {
      console.log("Firestore connection check completed:", errMsg);
    }
  }
}

validateFirestoreConnection();

// Initialize Firebase Auth
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Workspace oauth scopes
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/tasks");
provider.addScope("https://www.googleapis.com/auth/contacts");
provider.addScope("https://www.googleapis.com/auth/documents");
provider.addScope("https://www.googleapis.com/auth/presentations");
provider.addScope("https://www.googleapis.com/auth/forms.body");
provider.addScope("https://www.googleapis.com/auth/chat.spaces");
provider.addScope("https://www.googleapis.com/auth/chat.messages");

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Is Google user vs Email user
      const isGoogle = user.providerData.some(p => p.providerId === "google.com");
      if (isGoogle) {
        const storedToken = cachedAccessToken || localStorage.getItem("jarvis_google_workspace_token");
        if (storedToken) {
          cachedAccessToken = storedToken;
          if (onAuthSuccess) onAuthSuccess(user, storedToken);
        } else {
          if (!isSigningIn) {
            if (onAuthSuccess) onAuthSuccess(user, null);
          }
        }
      } else {
        // Email/Password login user
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign in with email and password
export const emailSignInClick = async (email: string, password: string): Promise<User> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error: any) {
    console.error("Email sign in error:", error);
    throw error;
  }
};

// Sign up with email, password, and custom student username/displayName
export const emailSignUpClick = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, {
      displayName: displayName.trim()
    });
    await credential.user.reload();
    return auth.currentUser || credential.user;
  } catch (error: any) {
    console.error("Email sign up error:", error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ----------------------------------------------------
// Firestore Hardened Error Handler
// ----------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const lowerMsg = errMsg.toLowerCase();
  const isQuota = 
    lowerMsg.includes("quota") || 
    lowerMsg.includes("exhausted") || 
    lowerMsg.includes("resource-exhausted") || 
    lowerMsg.includes("billing") ||
    lowerMsg.includes("resource_exhausted") ||
    lowerMsg.includes("capacity") ||
    lowerMsg.includes("exceeded") ||
    lowerMsg.includes("limit");

  if (isQuota && typeof window !== "undefined") {
    shutdownFirestoreDueToQuota(errMsg, operationType, path).catch(e => console.warn("Failed during proactive shutdown:", e));
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notification: ', JSON.stringify(errInfo));
  
  if (!isQuota) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Helper to convert operator name to a clean document ID path key
export function getOperatorDocId(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "_");
  return clean || "anonymous_operator";
}

// Check if write quota is exceeded or database is terminated
export function isFirestoreQuotaExceeded(): boolean {
  if (isDbTerminated) return true;
  if (typeof window !== "undefined") {
    return localStorage.getItem("jarvis_firestore_quota_exceeded") === "true";
  }
  return false;
}

// Enable network (with automatic page-level rehydration for terminated clients)
export async function enableFirestoreNetwork(): Promise<void> {
  try {
    localStorage.removeItem("jarvis_firestore_quota_exceeded");
    isDbTerminated = false;
    if (typeof window !== "undefined") {
      console.log("Re-enabling Firestore network connection context...");
      // If the client has been terminated, reload is necessary to rebuild instance pools
      window.location.reload();
    }
  } catch (e) {
    console.warn("Failed to enable Firestore network:", e);
  }
}

// Disable network
export async function disableFirestoreNetwork(): Promise<void> {
  try {
    await disableNetwork(db);
    console.log("Firestore network disabled successfully to prevent quota congestion.");
  } catch (e) {
    console.warn("Failed to disable Firestore network:", e);
  }
}

// Safe Clipboard copy helper with standard fallback for frame-based iframe environments
export async function safeCopyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Try navigator.clipboard.writeText first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, using textarea fallback:", err);
    }
  }
  
  // Fallback to legacy textarea copy (works even when document is not focused)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return !!successful;
  } catch (err) {
    console.error("Textarea copy fallback failed:", err);
  }
  return false;
}

// 1. Sync Profile Data to Google Cloud Realtime
export async function syncUserProfileToCloud(
  username: string, 
  data: {
    gmail: string;
    dateOfBirth: string;
    backupEnabled: boolean;
    avatarInitials: string;
    avatarImage: string;
    studentLevel?: string;
    jarvisTone?: string;
    selectedVoiceName?: string;
    googleVoiceName?: string;
    voiceRate?: number;
    voicePitch?: number;
    textLanguage?: string;
    voiceLanguage?: string;
    connectedAppsStr?: string;
    jarvisMemoriesStr?: string;
    chatHistoryItemsStr?: string;
    jarvisBehaviorRulesStr?: string;
  }
) {
  if (isFirestoreQuotaExceeded()) {
    console.warn("Cloud Sync postponed: Firestore write quota exceeded. Operating in Local-First core mode.");
    return;
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}`;
  try {
    const docRef = doc(db, "operators", opId);
    await setDoc(docRef, {
      username: username.trim(),
      gmail: data.gmail || "",
      dateOfBirth: data.dateOfBirth || "",
      backupEnabled: data.backupEnabled,
      avatarInitials: data.avatarInitials || "",
      avatarImage: data.avatarImage || "",
      studentLevel: data.studentLevel || "College",
      jarvisTone: data.jarvisTone || "Warm",
      selectedVoiceName: data.selectedVoiceName || "",
      googleVoiceName: data.googleVoiceName || "",
      voiceRate: data.voiceRate || 1.0,
      voicePitch: data.voicePitch || 1.0,
      textLanguage: data.textLanguage || "Benglish",
      voiceLanguage: data.voiceLanguage || "Benglish",
      connectedAppsStr: data.connectedAppsStr || "",
      jarvisMemoriesStr: data.jarvisMemoriesStr || "",
      chatHistoryItemsStr: data.chatHistoryItemsStr || "",
      jarvisBehaviorRulesStr: data.jarvisBehaviorRulesStr || "",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Real-time profile synced to Google Cloud.");
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2. Fetch User Profile from Google Cloud (for restore or verification)
export async function fetchUserProfileFromCloud(username: string) {
  if (isFirestoreQuotaExceeded()) {
    return null;
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}`;
  try {
    const docRef = doc(db, "operators", opId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// 3. Sync individual ChatDialogue to the sub-collection
export async function syncDialogueToCloud(username: string, message: Message) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getOperatorDocId(username);
  const msgId = message.id || `msg_${Date.now()}`;
  const path = `operators/${opId}/dialogues/${msgId}`;
  try {
    const docRef = doc(db, "operators", opId, "dialogues", msgId);
    await setDoc(docRef, {
      id: msgId,
      sender: message.sender,
      text: message.text || "",
      modelUsed: message.modelUsed || "Gemini-2.5",
      timestamp: message.timestamp || new Date().toISOString()
    });
    console.log(`DIALOGUE:${msgId} synced on-the-fly.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 4. Download and recover full chat logs from Google Cloud
export async function recoverAllDialoguesFromCloud(username: string): Promise<Message[]> {
  if (isFirestoreQuotaExceeded()) {
    return [];
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/dialogues`;
  try {
    const colRef = collection(db, "operators", opId, "dialogues");
    const q = query(colRef, orderBy("timestamp", "asc"));
    const snap = await getDocs(q);
    const msgs: Message[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      msgs.push({
        id: data.id,
        sender: data.sender as "user" | "jarvis",
        text: data.text,
        timestamp: data.timestamp,
        modelUsed: data.modelUsed
      });
    });
    return msgs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// 5. Firebase Sync for Google Keep fallback / Direct persistence
export interface KeepNoteEntity {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

export async function syncKeepNoteToCloud(username: string, note: KeepNoteEntity) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/keep_notes/${note.id}`;
  try {
    const docRef = doc(db, "operators", opId, "keep_notes", note.id);
    await setDoc(docRef, {
      id: note.id,
      title: note.title || "",
      body: note.body || "",
      timestamp: note.timestamp || new Date().toISOString()
    });
    console.log(`Keep Note ${note.id} synced to Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteKeepNoteFromCloud(username: string, noteId: string) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/keep_notes/${noteId}`;
  try {
    const docRef = doc(db, "operators", opId, "keep_notes", noteId);
    await deleteDoc(docRef);
    console.log(`Keep Note ${noteId} deleted from Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recoverAllKeepNotesFromCloud(username: string): Promise<KeepNoteEntity[]> {
  if (isFirestoreQuotaExceeded()) {
    return [];
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/keep_notes`;
  try {
    const colRef = collection(db, "operators", opId, "keep_notes");
    const q = query(colRef, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const notes: KeepNoteEntity[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: data.id,
        title: data.title || "",
        body: data.body || "",
        timestamp: data.timestamp || ""
      });
    });
    return notes;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// 6. Firebase Sync for Collaborative Chat fallback / Community room
export interface ChatMessageEntity {
  id: string;
  spaceId: string;
  sender: string;
  text: string;
  timestamp: string;
}

export async function syncChatMessageToCloud(username: string, msg: ChatMessageEntity) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/chat_messages/${msg.id}`;
  try {
    const docRef = doc(db, "operators", opId, "chat_messages", msg.id);
    await setDoc(docRef, {
      id: msg.id,
      spaceId: msg.spaceId || "general",
      sender: msg.sender || username,
      text: msg.text || "",
      timestamp: msg.timestamp || new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function recoverAllChatMessagesFromCloud(username: string, spaceId: string): Promise<ChatMessageEntity[]> {
  if (isFirestoreQuotaExceeded()) {
    return [];
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/chat_messages`;
  try {
    const colRef = collection(db, "operators", opId, "chat_messages");
    const q = query(colRef, orderBy("timestamp", "asc"));
    const snap = await getDocs(q);
    const msgs: ChatMessageEntity[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.spaceId === spaceId) {
        msgs.push({
          id: data.id,
          spaceId: data.spaceId,
          sender: data.sender || "Unknown",
          text: data.text || "",
          timestamp: data.timestamp || ""
        });
      }
    });
    return msgs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// 7. Firebase Sync for User Feedback reports
export interface UserFeedbackEntity {
  id: string;
  feedbackType: string;
  message: string;
  timestamp: string;
}

export async function syncUserFeedbackToCloud(username: string, feedback: UserFeedbackEntity) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getOperatorDocId(username);
  const path = `operators/${opId}/feedbacks/${feedback.id}`;
  try {
    const docRef = doc(db, "operators", opId, "feedbacks", feedback.id);
    await setDoc(docRef, {
      id: feedback.id,
      feedbackType: feedback.feedbackType || "suggestion",
      message: feedback.message || "",
      timestamp: feedback.timestamp || new Date().toISOString()
    });
    console.log(`User feedback ${feedback.id} synced to Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

