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
  disableNetwork,
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
  updateProfile,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
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
  localStorage.setItem(`jarvis_firestore_quota_exceeded_${auth?.currentUser?.uid || 'guest'}`, "true");
  
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
  
  if (localStorage.getItem(`jarvis_firestore_quota_exceeded_${auth?.currentUser?.uid || 'guest'}`) === "true") {
    await shutdownFirestoreDueToQuota("Previously detected Firestore quota exceeded on boot", "init", "users/boot");
    return;
  }

  try {
    const dummyRef = doc(db, "users", "test_connection_dummy_id_probe");
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
      await shutdownFirestoreDueToQuota(errMsg, "get", "users/test_connection_dummy_id_probe");
    } else {
      console.log("Firestore connection check completed:", errMsg);
    }
  }
}

// validateFirestoreConnection();

// Initialize Firebase Auth
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

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
        const storedToken = cachedAccessToken || null;
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
    console.warn("Email sign in validation:", error?.code || error?.message);
    throw error;
  }
};

// Sign up with email, password, and custom username/displayName
export const emailSignUpClick = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, {
      displayName: displayName.trim()
    });
    await credential.user.reload();
    return auth.currentUser || credential.user;
  } catch (error: any) {
    console.warn("Email sign up validation:", error?.code || error?.message);
    throw error;
  }
};

// Send password reset email
export const sendPasswordReset = async (email: string): Promise<string> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.includes("password")) {
      await sendPasswordResetEmail(auth, email);
      return "SUCCESS_PASSWORD";
    } else if (methods.includes("google.com")) {
      return "GOOGLE_ONLY";
    } else {
      // If there are other methods or empty array, try sending anyway just in case
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (e) {
        console.warn("sendPasswordResetEmail failed in fallback:", e);
      }
      return "SAFE_MESSAGE";
    }
  } catch (error: any) {
    console.warn("fetchSignInMethodsForEmail error:", error);
    const errCode = error.code || "";
    const errMsg = error.message || "";
    
    // Pass standard handleable errors up to the caller
    if (errCode === "auth/invalid-email" || errMsg.includes("invalid-email")) {
      throw error;
    }
    if (errCode === "auth/user-not-found" || errMsg.includes("user-not-found")) {
      throw error;
    }
    if (errCode === "auth/too-many-requests" || errMsg.includes("too-many-requests")) {
      throw error;
    }

    // Otherwise, provider lookup is blocked/restricted. Fallback to sending reset email directly
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: any) {
      console.warn("sendPasswordResetEmail fallback nested error:", e);
      const subCode = e.code || "";
      const subMsg = e.message || "";
      if (subCode === "auth/invalid-email" || subMsg.includes("invalid-email")) {
        throw e;
      }
      if (subCode === "auth/user-not-found" || subMsg.includes("user-not-found")) {
        throw e;
      }
      if (subCode === "auth/too-many-requests" || subMsg.includes("too-many-requests")) {
        throw e;
      }
    }
    return "SAFE_MESSAGE";
  }
};

// Update existing authenticated user's display name inside Firebase Authentication
export const updateAuthDisplayName = async (newDisplayName: string): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName.trim()
      });
      await auth.currentUser.reload();
      console.log("Firebase Auth user's display name successfully updated to:", newDisplayName);
    }
  } catch (error) {
    console.warn("Failed to update display name in Firebase Auth:", error);
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
  const isDocumentSizeError = lowerMsg.includes("maximum allowed size") || lowerMsg.includes("1,048,576") || lowerMsg.includes("document size");
  
  const isQuota = 
    !isDocumentSizeError && (
      lowerMsg.includes("quota exceeded") || 
      lowerMsg.includes("resource-exhausted") || 
      lowerMsg.includes("resource_exhausted") ||
      lowerMsg.includes("daily limit") ||
      lowerMsg.includes("quota exhausted")
    );

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
  
  // Log Firestore notifications safely instead of crashing the client runtime container
  console.error("Firestore error experienced:", JSON.stringify(errInfo));
}

// Helper to convert operator name to a clean document ID path key
export function getUserDocId(): string | null {
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  return "anonymous_user";
}

// Check if write quota is exceeded or database is terminated
export function isFirestoreQuotaExceeded(): boolean {
  if (isDbTerminated) return true;
  if (typeof window !== "undefined") {
    return localStorage.getItem(`jarvis_firestore_quota_exceeded_${auth?.currentUser?.uid || 'guest'}`) === "true";
  }
  return false;
}

// Enable network (with automatic page-level rehydration for terminated clients)
export async function enableFirestoreNetwork(): Promise<void> {
  try {
    localStorage.removeItem(`jarvis_firestore_quota_exceeded_${auth?.currentUser?.uid || 'guest'}`);
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

/**
 * Prunes the stringified chat history items if they exceed a target size.
 * This prevents hitting the 1MB Firestore document limit by retaining the most
 * recent sessions, and within those sessions, the most recent messages.
 */
export function pruneChatHistoryItemsStr(jsonStr: string, maxSizeBytes: number = 300 * 1024): string {
  try {
    if (!jsonStr) {
      return jsonStr;
    }
    
    // Parse the sessions
    let sessions = JSON.parse(jsonStr);
    if (!Array.isArray(sessions)) {
      return jsonStr;
    }

    // Clone sessions to avoid mutability side effects
    sessions = JSON.parse(JSON.stringify(sessions));

    // Pre-pass: Strip out extremely large base64 strings and attachment payloads to prevent Firestore 1MB limits
    sessions.forEach((sess: any) => {
      if (sess && Array.isArray(sess.messages)) {
        sess.messages.forEach((m: any) => {
          if (m) {
            // Strip large attachments (base64 or long data strings)
            if (m.attachment && m.attachment.length > 10 * 1024) {
              m.attachment = "[Attachment removed to conserve database quota]";
            }
            // Strip large canvas code strings if any single message exceeds 30KB
            if (m.canvasCodeText && m.canvasCodeText.length > 30 * 1024) {
              m.canvasCodeText = m.canvasCodeText.substring(0, 5000) + "\n\n... [Code truncated to conserve cloud storage space] ...";
            }
          }
        });
      }
    });

    if (JSON.stringify(sessions).length <= maxSizeBytes) {
      return JSON.stringify(sessions);
    }

    // Phase 1 pruning: Limit to 15 sessions and 15 messages per session
    if (sessions.length > 15) {
      sessions = sessions.slice(-15);
    }
    sessions.forEach((sess: any) => {
      if (sess && Array.isArray(sess.messages) && sess.messages.length > 15) {
        sess.messages = sess.messages.slice(-15);
      }
    });

    let currentStr = JSON.stringify(sessions);
    if (currentStr.length <= maxSizeBytes) {
      console.log(`[Firestore Sync Optimizer] Chat history successfully pruned (Phase 1) to ${Math.round(currentStr.length / 1024)} KB.`);
      return currentStr;
    }

    // Phase 2 pruning: Limit to 8 sessions and 10 messages per session
    if (sessions.length > 8) {
      sessions = sessions.slice(-8);
    }
    sessions.forEach((sess: any) => {
      if (sess && Array.isArray(sess.messages) && sess.messages.length > 10) {
        sess.messages = sess.messages.slice(-10);
      }
    });

    currentStr = JSON.stringify(sessions);
    if (currentStr.length <= maxSizeBytes) {
      console.log(`[Firestore Sync Optimizer] Chat history successfully pruned (Phase 2) to ${Math.round(currentStr.length / 1024)} KB.`);
      return currentStr;
    }

    // Phase 3 pruning: Limit to 4 sessions and 5 messages per session
    if (sessions.length > 4) {
      sessions = sessions.slice(-4);
    }
    sessions.forEach((sess: any) => {
      if (sess && Array.isArray(sess.messages) && sess.messages.length > 5) {
        sess.messages = sess.messages.slice(-5);
      }
    });

    currentStr = JSON.stringify(sessions);
    console.log(`[Firestore Sync Optimizer] Chat history heavily pruned (Phase 3) to ${Math.round(currentStr.length / 1024)} KB.`);
    return currentStr;
  } catch (e) {
    console.error("Error during chatHistoryItemsStr pruning:", e);
    return jsonStr;
  }
}

/**
 * Prunes a single chat session object to strictly comply with Firestore's 1MB document limit (targeting <= 450KB).
 * - Strips huge base64 attachments, large generated visual URLs, and oversized code payloads
 * - Keeps the most recent messages if total size exceeds limit
 */
export function pruneSingleChatSession(session: any, maxSizeBytes: number = 450 * 1024): any {
  if (!session || typeof session !== "object") return session;
  
  // Clone to avoid mutating in-memory React state
  let sess: any;
  try {
    sess = JSON.parse(JSON.stringify(session));
  } catch (e) {
    return session;
  }

  if (Array.isArray(sess.messages)) {
    // 1. Strip large base64 attachments, large image data strings, or canvas code
    sess.messages.forEach((m: any) => {
      if (m && typeof m === "object") {
        if (typeof m.attachment === "string" && m.attachment.length > 8 * 1024) {
          m.attachment = "[Attachment stored locally / omitted from cloud sync]";
        }
        if (typeof m.generationResultUrl === "string" && m.generationResultUrl.startsWith("data:") && m.generationResultUrl.length > 8 * 1024) {
          m.generationResultUrl = "[Generated visual payload omitted from cloud sync]";
        }
        if (typeof m.canvasCodeText === "string" && m.canvasCodeText.length > 20 * 1024) {
          m.canvasCodeText = m.canvasCodeText.substring(0, 5000) + "\n\n... [Code truncated to conserve cloud storage space] ...";
        }
        if (typeof m.canvasWritingText === "string" && m.canvasWritingText.length > 20 * 1024) {
          m.canvasWritingText = m.canvasWritingText.substring(0, 5000) + "\n\n... [Text truncated to conserve cloud storage space] ...";
        }
        if (typeof m.text === "string" && m.text.length > 30 * 1024) {
          m.text = m.text.substring(0, 15000) + "\n\n... [Message content truncated to fit cloud storage limit]";
        }
      }
    });

    // Check size
    let serialized = JSON.stringify(sess);
    if (serialized.length <= maxSizeBytes) {
      return sess;
    }

    // 2. Progressive message reduction: keep the most recent messages
    const limits = [60, 40, 25, 15, 10, 5];
    for (const limit of limits) {
      if (sess.messages.length > limit) {
        sess.messages = sess.messages.slice(-limit);
        serialized = JSON.stringify(sess);
        if (serialized.length <= maxSizeBytes) {
          return sess;
        }
      }
    }

    // 3. If individual message texts are still massive, truncate them further
    sess.messages.forEach((m: any) => {
      if (m && typeof m.text === "string" && m.text.length > 4 * 1024) {
        m.text = m.text.substring(0, 2500) + "\n... [Message truncated to fit cloud storage limit]";
      }
    });
  }

  return sess;
}

// 1. Sync Profile Data to Google Cloud Realtime
export async function syncUserProfileToCloud(_username: string, 
  data: {
    gmail?: string;
    dateOfBirth?: string;
    backupEnabled?: boolean;
    avatarInitials?: string;
    avatarImage?: string;
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
    username?: string;
    geminiKey?: string;
    geminiKeyPoolStr?: string;
    appTheme?: string;
    jarvisVolumePreset?: string;
    voiceEngine?: string;
    baseStyleTone?: string;
    isFastAnswers?: boolean;
    customInstructions?: string;
    isReferenceMemories?: boolean;
    isReferenceHistory?: boolean;
    nicknameMemory?: string;
    occupationMemory?: string;
    moreAboutUser?: string;
        buttonAccentColorStr?: string;
    [key: string]: any;
  }
) {
  if (isFirestoreQuotaExceeded()) {
    console.warn("Cloud Sync postponed: Firestore write quota exceeded. Operating in Local-First core mode.");
    return;
  }
  const opId = getUserDocId();
  if (!opId) return;
  const path = `users/${opId}`;
  try {
    const docRef = doc(db, "users", opId);
    
    // Dynamically construct payload using only fields that are explicitly provided (i.e. not undefined)
    const payload: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    const allowedKeys = [
      "gmail", "dateOfBirth", "backupEnabled", "avatarInitials", "avatarImage",
      "jarvisTone", "selectedVoiceName", "googleVoiceName", "voiceRate",
      "voicePitch", "textLanguage", "voiceLanguage", "connectedAppsStr", "jarvisMemoriesStr",
      "chatHistoryItemsStr", "jarvisBehaviorRulesStr", "geminiKey", "geminiKeyPoolStr",
      "disabledGeminiKeysStr", "aiPlanMode",
      "appTheme", "jarvisVolumePreset", "voiceEngine", "baseStyleTone", 
       "isFastAnswers", "customInstructions",
      "isReferenceMemories", "isReferenceHistory", "nicknameMemory", "occupationMemory",
      "moreAboutUser", "buttonAccentColorStr", "modelPreferencesStr", "voiceMessagesStr",
      "dailyRequestCount", "dailyRequestLimit", "lastRequestResetDate",
      "totalRequests", "successRequests", "totalTokens", "averageResponseTime", "latencyHistoryStr"
    ];

    allowedKeys.forEach(key => {
      if (data[key] !== undefined) {
        payload[key] = data[key];
      }
    });

    // Store profile strictly under users/{uid}/profile.name and users/{uid}/profile.email
    const profileName = data.username || data.profile?.name || auth.currentUser?.displayName || auth.currentUser?.email || "Guest User";
    const profileEmail = data.profile?.email || data.gmail || auth.currentUser?.email || "";
    payload.profile = {
      name: profileName,
      email: profileEmail
    };

    // Explicitly ensure flat fields are not in the payload
    delete payload.username;
    delete payload.profileHandle;

    

    // Safely prune chat history items string before syncing to Firestore
    if (payload.chatHistoryItemsStr) {
      payload.chatHistoryItemsStr = pruneChatHistoryItemsStr(payload.chatHistoryItemsStr, 300 * 1024);
    }

    // Avoid syncing excessively large base64 avatar images that will cause Firestore write errors
    if (payload.avatarImage && payload.avatarImage.startsWith("data:image/") && payload.avatarImage.length > 100 * 1024) {
      console.warn(`[Firestore Sync Optimizer] Avatar image is too large (${Math.round(payload.avatarImage.length / 1024)} KB) for the main Firestore profile document. Skipping avatar sync to avoid document size limits.`);
      delete payload.avatarImage;
    }

    const cleanPayload = sanitizeForFirestore(payload);
    await setDoc(docRef, cleanPayload, { merge: true });
    console.log("Real-time profile synced to Google Cloud.");
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2. Fetch User Profile from Google Cloud (for restore or verification)
export async function fetchUserProfileFromCloud() {
  if (isFirestoreQuotaExceeded()) {
    return null;
  }
  const opId = getUserDocId();
  if (!opId) return null;
  const path = `users/${opId}`;
  try {
    const docRef = doc(db, "users", opId);
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
export async function syncDialogueToCloud(_username: string, message: Message) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getUserDocId();
  if (!opId) return;
  const msgId = message.id || `msg_${Date.now()}`;
  const path = `users/${opId}/dialogues/${msgId}`;
  try {
    const docRef = doc(db, "users", opId, "dialogues", msgId);
    const cleanDialogue = sanitizeForFirestore({
      id: msgId,
      sender: message.sender,
      text: message.text || "",
      modelUsed: message.modelUsed || "Gemini",
      timestamp: message.timestamp || new Date().toISOString()
    });
    await setDoc(docRef, cleanDialogue);
    console.log(`DIALOGUE:${msgId} synced on-the-fly.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 4. Download and recover full chat logs from Google Cloud
export async function recoverAllDialoguesFromCloud(): Promise<Message[]> {
  if (isFirestoreQuotaExceeded()) {
    return [];
  }
  const opId = getUserDocId();
  if (!opId) return [];
  const path = `users/${opId}/dialogues`;
  try {
    const colRef = collection(db, "users", opId, "dialogues");
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

export async function syncKeepNoteToCloud(_username: string, note: KeepNoteEntity) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getUserDocId();
  if (!opId || !note || !note.id) return;
  const path = `users/${opId}/keep_notes/${note.id}`;
  try {
    const docRef = doc(db, "users", opId, "keep_notes", note.id);
    const cleanNote = sanitizeForFirestore({
      id: note.id,
      title: note.title || "",
      body: note.body || "",
      timestamp: note.timestamp || new Date().toISOString()
    });
    await setDoc(docRef, cleanNote);
    console.log(`Keep Note ${note.id} synced to Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteKeepNoteFromCloud(_username: string, noteId: string) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getUserDocId();
  if (!opId) return;
  const path = `users/${opId}/keep_notes/${noteId}`;
  try {
    const docRef = doc(db, "users", opId, "keep_notes", noteId);
    await deleteDoc(docRef);
    console.log(`Keep Note ${noteId} deleted from Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recoverAllKeepNotesFromCloud(_username: string): Promise<KeepNoteEntity[]> {
  if (isFirestoreQuotaExceeded()) {
    return [];
  }
  const opId = getUserDocId();
  if (!opId) return [];
  const path = `users/${opId}/keep_notes`;
  try {
    const colRef = collection(db, "users", opId, "keep_notes");
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

export async function syncChatMessageToCloud(_username: string, msg: ChatMessageEntity) {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  const opId = getUserDocId();
  if (!opId || !msg || !msg.id) return;
  const path = `users/${opId}/chat_messages/${msg.id}`;
  try {
    const docRef = doc(db, "users", opId, "chat_messages", msg.id);
    const cleanMsg = sanitizeForFirestore({
      id: msg.id,
      spaceId: msg.spaceId || "general",
      sender: msg.sender || _username,
      text: msg.text || "",
      timestamp: msg.timestamp || new Date().toISOString()
    });
    await setDoc(docRef, cleanMsg);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function recoverAllChatMessagesFromCloud(_username: string, spaceId: string): Promise<ChatMessageEntity[]> {
  if (isFirestoreQuotaExceeded()) {
    return [];
  }
  const opId = getUserDocId();
  if (!opId) return [];
  const path = `users/${opId}/chat_messages`;
  try {
    const colRef = collection(db, "users", opId, "chat_messages");
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

validateFirestoreConnection();

/**
 * Recursively removes all `undefined` values from an object or array
 * so that Firestore's setDoc/updateDoc never fails with:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

export async function syncChatSessionToCloud(_username: string, session: any) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId || !session || !session.id) return;
  const path = `users/${opId}/chat_sessions/${session.id}`;
  try {
    const docRef = doc(db, "users", opId, "chat_sessions", session.id);
    const prunedSession = pruneSingleChatSession(session, 450 * 1024);
    const cleanPayload = sanitizeForFirestore({
      ...prunedSession,
      id: session.id,
      text: session.text || session.title || "Chat Session",
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes("exceeds the maximum allowed size") || errMsg.includes("1,048,576") || errMsg.includes("too large")) {
      console.warn(`[Firestore Optimization] Session ${session.id} payload too large, executing emergency compaction...`);
      try {
        const emergencyPruned = pruneSingleChatSession(session, 150 * 1024);
        const docRef = doc(db, "users", opId, "chat_sessions", session.id);
        const cleanPayload = sanitizeForFirestore({
          ...emergencyPruned,
          id: session.id,
          text: session.text || session.title || "Chat Session",
          updatedAt: new Date().toISOString()
        });
        await setDoc(docRef, cleanPayload, { merge: true });
        return;
      } catch (compactErr) {
        console.warn(`[Firestore Optimization] Emergency compaction fallback:`, compactErr);
      }
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteChatSessionFromCloud(_username: string, sessionId: string) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId) return;
  const path = `users/${opId}/chat_sessions/${sessionId}`;
  try {
    const docRef = doc(db, "users", opId, "chat_sessions", sessionId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recoverAllChatSessionsFromCloud(): Promise<any[]> {
  if (isFirestoreQuotaExceeded()) return [];
  const opId = getUserDocId();
  if (!opId) return [];
  try {
    const colRef = collection(db, "users", opId, "chat_sessions");
    const snap = await getDocs(colRef);
    const sessions: any[] = [];
    snap.forEach((doc) => {
      sessions.push(doc.data());
    });
    // Sort by timestamp or updatedAt descending
    return sessions.sort((a, b) => {
      const timeA = a.timestamp || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.timestamp || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${opId}/chat_sessions`);
    return [];
  }
}

// ----------------------------------------------------------------------
// JARVIS MEMORIES SUBCOLLECTION
// ----------------------------------------------------------------------
export async function syncJarvisMemoryToCloud(_username: string, memory: any) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId || !memory || !memory.id) return;
  const path = `users/${opId}/jarvis_memories/${memory.id}`;
  try {
    const docRef = doc(db, "users", opId, "jarvis_memories", memory.id);
    const cleanMemory = sanitizeForFirestore({ ...memory, updatedAt: new Date().toISOString() });
    await setDoc(docRef, cleanMemory);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteJarvisMemoryFromCloud(_username: string, memoryId: string) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId) return;
  const path = `users/${opId}/jarvis_memories/${memoryId}`;
  try {
    const docRef = doc(db, "users", opId, "jarvis_memories", memoryId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recoverAllJarvisMemoriesFromCloud(): Promise<any[]> {
  if (isFirestoreQuotaExceeded()) return [];
  const opId = getUserDocId();
  if (!opId) return [];
  try {
    const colRef = collection(db, "users", opId, "jarvis_memories");
    const snap = await getDocs(colRef);
    const items: any[] = [];
    snap.forEach((doc) => items.push(doc.data()));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${opId}/jarvis_memories`);
    return [];
  }
}

// ----------------------------------------------------------------------
// JARVIS BEHAVIOR RULES SUBCOLLECTION
// ----------------------------------------------------------------------
export async function syncJarvisBehaviorRuleToCloud(_username: string, rule: any) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId || !rule || !rule.id) return;
  const path = `users/${opId}/jarvis_behavior_rules/${rule.id}`;
  try {
    const docRef = doc(db, "users", opId, "jarvis_behavior_rules", rule.id);
    const cleanRule = sanitizeForFirestore({ ...rule, updatedAt: new Date().toISOString() });
    await setDoc(docRef, cleanRule);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteJarvisBehaviorRuleFromCloud(_username: string, ruleId: string) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId) return;
  const path = `users/${opId}/jarvis_behavior_rules/${ruleId}`;
  try {
    const docRef = doc(db, "users", opId, "jarvis_behavior_rules", ruleId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recoverAllJarvisBehaviorRulesFromCloud(): Promise<any[]> {
  if (isFirestoreQuotaExceeded()) return [];
  const opId = getUserDocId();
  if (!opId) return [];
  try {
    const colRef = collection(db, "users", opId, "jarvis_behavior_rules");
    const snap = await getDocs(colRef);
    const items: any[] = [];
    snap.forEach((doc) => items.push(doc.data()));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${opId}/jarvis_behavior_rules`);
    return [];
  }
}

// ----------------------------------------------------------------------
// VOICE MESSAGES SUBCOLLECTION
// ----------------------------------------------------------------------
export async function syncVoiceMessageToCloud(_username: string, msg: any) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId || !msg || !msg.id) return;
  const path = `users/${opId}/voice_messages/${msg.id}`;
  try {
    const docRef = doc(db, "users", opId, "voice_messages", msg.id);
    let msgToSync = { ...msg };
    if (typeof msgToSync.audioBase64 === "string" && msgToSync.audioBase64.length > 500 * 1024) {
      msgToSync.audioBase64 = "[Audio data stored locally / omitted from cloud sync]";
    }
    const cleanMsg = sanitizeForFirestore({ ...msgToSync, updatedAt: new Date().toISOString() });
    await setDoc(docRef, cleanMsg);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteVoiceMessageFromCloud(_username: string, msgId: string) {
  if (isFirestoreQuotaExceeded()) return;
  const opId = getUserDocId();
  if (!opId) return;
  const path = `users/${opId}/voice_messages/${msgId}`;
  try {
    const docRef = doc(db, "users", opId, "voice_messages", msgId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function recoverAllVoiceMessagesFromCloud(): Promise<any[]> {
  if (isFirestoreQuotaExceeded()) return [];
  const opId = getUserDocId();
  if (!opId) return [];
  try {
    const colRef = collection(db, "users", opId, "voice_messages");
    const snap = await getDocs(colRef);
    const items: any[] = [];
    snap.forEach((doc) => items.push(doc.data()));
    // Sort by timestamp
    return items.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `users/${opId}/voice_messages`);
    return [];
  }
}
