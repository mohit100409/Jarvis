import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HardDrive,
  FileSpreadsheet,
  Mail,
  Calendar,
  CheckSquare,
  Users,
  MessageSquare,
  FolderOpen,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Check,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
  Inbox,
  LogOut,
  ChevronRight,
  StickyNote,
  Presentation,
  ClipboardList,
  Video
} from "lucide-react";
import {
  syncKeepNoteToCloud,
  recoverAllKeepNotesFromCloud,
  deleteKeepNoteFromCloud,
  syncChatMessageToCloud,
  recoverAllChatMessagesFromCloud,
  KeepNoteEntity,
  ChatMessageEntity
} from "../firebase";

interface GoogleWorkspaceDashboardProps {
  token: string | null;
  onLogin: () => void;
  onLogout: () => void;
  gmail: string;
  username: string;
}

type TabType = "drive" | "sheets" | "gmail" | "calendar" | "tasks" | "contacts" | "chat" | "picker" | "keep" | "docs" | "slides" | "forms" | "meet";

export default function GoogleWorkspaceDashboard({
  token,
  onLogin,
  onLogout,
  gmail,
  username
}: GoogleWorkspaceDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("drive");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // States for Drive
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState("");
  const [newFileName, setNewFileName] = useState("");

  // States for Sheets
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string>("");
  const [sheetValues, setSheetValues] = useState<any[][]>([]);
  const [newSheetTitle, setNewSheetTitle] = useState("");
  const [cellEdit, setCellEdit] = useState({ range: "A1", value: "" });

  // States for Gmail
  const [emails, setEmails] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [composeEmail, setComposeEmail] = useState({ to: "", subject: "", body: "" });

  // States for Calendar
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ summary: "", description: "", startTime: "", endTime: "" });

  // States for Tasks
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [activeTaskListId, setActiveTaskListId] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // States for Contacts
  const [contacts, setContacts] = useState<any[]>([]);
  const [newContact, setNewContact] = useState({ givenName: "", familyName: "", email: "", phone: "" });

  // States for Chat
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatRoomMessages, setChatRoomMessages] = useState<ChatMessageEntity[]>([]);

  // States for Keep fallback & REST API
  const [keepNotes, setKeepNotes] = useState<KeepNoteEntity[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");

  // States for Docs SDK
  const [docsList, setDocsList] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [docDetailText, setDocDetailText] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");

  // States for Slides SDK
  const [slidesList, setSlidesList] = useState<any[]>([]);
  const [newSlidesTitle, setNewSlidesTitle] = useState("");

  // States for Forms SDK
  const [formsList, setFormsList] = useState<any[]>([]);
  const [newFormTitle, setNewFormTitle] = useState("");

  // States for Meet SDK
  const [meetSpaces, setMeetSpaces] = useState<any[]>([]);
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [generatedMeetLink, setGeneratedMeetLink] = useState("");

  // Picker selection state
  const [selectedPickerFile, setSelectedPickerFile] = useState<any>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  // Auto load when tab changes or token changes
  useEffect(() => {
    if (token) {
      fetchTabData();
    }
  }, [activeTab, token]);

  const fetchTabData = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      if (activeTab === "drive" || activeTab === "picker") {
        await loadDriveFiles();
      } else if (activeTab === "sheets") {
        await loadSpreadsheets();
      } else if (activeTab === "gmail") {
        await loadEmails();
      } else if (activeTab === "calendar") {
        await loadCalendarEvents();
      } else if (activeTab === "tasks") {
        await loadTaskLists();
      } else if (activeTab === "contacts") {
        await loadContacts();
      } else if (activeTab === "chat") {
        await loadChatSpaces();
      } else if (activeTab === "keep") {
        await loadKeepNotes();
      } else if (activeTab === "docs") {
        await loadDocsFiles();
      } else if (activeTab === "slides") {
        await loadSlidesFiles();
      } else if (activeTab === "forms") {
        await loadFormsFiles();
      } else if (activeTab === "meet") {
        await loadMeetSpaces();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`API error: ${err.message || "Failed to load Google Workspace data"}`);
    } finally {
      setLoading(false);
    }
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  // ==========================================
  // GOOGLE DRIVE CAPABILITIES
  // ==========================================
  const loadDriveFiles = async () => {
    const q = driveSearch ? `name contains '${driveSearch}'` : "";
    const url = `https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webContentLink)&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setDriveFiles(data.files || []);
  };

  const handleCreateDriveFile = async () => {
    if (!newFileName.trim()) return;
    showConfirmation(
      "Create Google Drive File",
      `Are you sure you want to create a new text file named "${newFileName}" inside your Google Drive?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: newFileName.endsWith(".txt") ? newFileName : `${newFileName}.txt`,
              mimeType: "text/plain"
            })
          });
          if (!res.ok) throw new Error("Failed to create file");
          setNewFileName("");
          setStatusMsg("File created successfully!");
          await loadDriveFiles();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteDriveFile = async (id: string, name: string) => {
    showConfirmation(
      "Delete Google Drive File",
      `Are you sure you want to permanently delete "${name}" from your Google Drive? This action cannot be undone.`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to delete file");
          setStatusMsg("File deleted successfully.");
          await loadDriveFiles();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE SHEETS CAPABILITIES
  // ==========================================
  const loadSpreadsheets = async () => {
    // List spreadsheets in Drive
    const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=15&fields=files(id,name)`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const list = data.files || [];
    setSpreadsheets(list);
    if (list.length > 0 && !activeSpreadsheetId) {
      setActiveSpreadsheetId(list[0].id);
      await loadSheetValues(list[0].id);
    }
  };

  const loadSheetValues = async (id: string) => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1:E12`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSheetValues(data.values || [["(Empty Spreadsheet)"]]);
    } catch (_) {
      setSheetValues([["Error reading data / sheet empty"]]);
    }
  };

  const handleCreateSpreadsheet = async () => {
    if (!newSheetTitle.trim()) return;
    showConfirmation(
      "Create Google Sheet",
      `Are you sure you want to initialize a new spreadsheet named "${newSheetTitle}"?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ properties: { title: newSheetTitle } })
          });
          const data = await res.json();
          if (!res.ok) throw new Error("Failed to create spreadsheet");
          setNewSheetTitle("");
          setStatusMsg("Spreadsheet created successfully!");
          await loadSpreadsheets();
          if (data.spreadsheetId) {
            setActiveSpreadsheetId(data.spreadsheetId);
            await loadSheetValues(data.spreadsheetId);
          }
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleEditCell = async () => {
    if (!activeSpreadsheetId || !cellEdit.range || !cellEdit.value) return;
    showConfirmation(
      "Update Sheet Cells",
      `Are you sure you want to write "${cellEdit.value}" into cell range [${cellEdit.range}]?`,
      async () => {
        try {
          setLoading(true);
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${activeSpreadsheetId}/values/${cellEdit.range}?valueInputOption=USER_ENTERED`;
          const res = await fetch(url, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ values: [[cellEdit.value]] })
          });
          if (!res.ok) throw new Error("Failed to update cells");
          setStatusMsg("Spreadsheet updated successfully.");
          await loadSheetValues(activeSpreadsheetId);
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GMAIL CAPABILITIES
  // ==========================================
  const loadEmails = async () => {
    const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8";
    const res = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
    const listData = await res.json();
    const msgs = listData.messages || [];

    if (msgs.length === 0) {
      setEmails([]);
      return;
    }

    const emailDetails = await Promise.all(
      msgs.map(async (msg: any) => {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
        const detailRes = await fetch(detailUrl, { headers: { Authorization: `Bearer ${token}` } });
        const detailData = await detailRes.json();

        const headers = detailData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "(Unknown)";
        return {
          id: msg.id,
          subject,
          from,
          snippet: detailData.snippet || ""
        };
      })
    );
    setEmails(emailDetails);

    // Count unread
    try {
      const statsRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels/UNREAD", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stats = await statsRes.json();
      setUnreadCount(stats.messagesUnread || 0);
    } catch (_) {
      setUnreadCount(0);
    }
  };

  const handleSendEmail = async () => {
    const { to, subject, body } = composeEmail;
    if (!to || !subject || !body) return;

    showConfirmation(
      "Send Gmail Transmission",
      `Are you sure you want to transmit this email out to "${to}" with subject "${subject}"?`,
      async () => {
        try {
          setLoading(true);
          const mimeStr = [
            `To: ${to}\r\n`,
            `Subject: ${subject}\r\n`,
            "Content-Type: text/plain; charset=utf-8\r\n\r\n",
            body
          ].join("");
          const base64Safe = btoa(unescape(encodeURIComponent(mimeStr)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

          const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ raw: base64Safe })
          });
          if (!res.ok) throw new Error("Failed to send email");
          setComposeEmail({ to: "", subject: "", body: "" });
          setStatusMsg("Email transmitted successfully.");
          await loadEmails();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE CALENDAR CAPABILITIES
  // ==========================================
  const loadCalendarEvents = async () => {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=8&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCalendarEvents(data.items || []);
  };

  const handleCreateEvent = async () => {
    const { summary, description, startTime, endTime } = newEvent;
    if (!summary || !startTime || !endTime) return;

    showConfirmation(
      "Schedule Calendar Event",
      `Are you sure you want to log "${summary}" into your Google Calendar on ${new Date(startTime).toLocaleString()}?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              summary,
              description,
              start: { dateTime: new Date(startTime).toISOString() },
              end: { dateTime: new Date(endTime).toISOString() }
            })
          });
          if (!res.ok) throw new Error("Failed to create calendar event");
          setNewEvent({ summary: "", description: "", startTime: "", endTime: "" });
          setStatusMsg("Calendar event logged and synchronized successfully.");
          await loadCalendarEvents();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteEvent = async (id: string, summary: string) => {
    showConfirmation(
      "Delete Calendar Event",
      `Are you sure you want to remove "${summary}" from your Google Calendar?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to delete event");
          setStatusMsg("Event deleted successfully.");
          await loadCalendarEvents();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE TASKS CAPABILITIES
  // ==========================================
  const loadTaskLists = async () => {
    const res = await fetch("https://tasks.googleapis.com/v1/users/@me/lists", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const lists = data.items || [];
    setTaskLists(lists);
    if (lists.length > 0 && !activeTaskListId) {
      setActiveTaskListId(lists[0].id);
      await loadTasks(lists[0].id);
    }
  };

  const loadTasks = async (id: string) => {
    const res = await fetch(`https://tasks.googleapis.com/v1/lists/${id}/tasks?showCompleted=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setTasks(data.items || []);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !activeTaskListId) return;
    showConfirmation(
      "Create Google Task",
      `Are you sure you want to add "${newTaskTitle}" to your active Task List?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch(`https://tasks.googleapis.com/v1/lists/${activeTaskListId}/tasks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ title: newTaskTitle })
          });
          if (!res.ok) throw new Error("Failed to create task");
          setNewTaskTitle("");
          setStatusMsg("Task logged successfully!");
          await loadTasks(activeTaskListId);
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (!activeTaskListId) return;
    const nextStatus = currentStatus === "completed" ? "needsAction" : "completed";
    try {
      setLoading(true);
      const res = await fetch(`https://tasks.googleapis.com/v1/lists/${activeTaskListId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error("Failed to mutate task");
      await loadTasks(activeTaskListId);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeTaskListId) return;
    showConfirmation(
      "Remove Google Task",
      "Are you sure you want to permanently purge this task from your checklist?",
      async () => {
        try {
          setLoading(true);
          const res = await fetch(`https://tasks.googleapis.com/v1/lists/${activeTaskListId}/tasks/${taskId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Failed to delete task");
          setStatusMsg("Task purged from list.");
          await loadTasks(activeTaskListId);
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE CONTACTS CAPABILITIES (PEOPLE API)
  // ==========================================
  const loadContacts = async () => {
    const url = "https://people.googleapis.com/v1/people/me/connections?pageSize=15&personFields=names,emailAddresses,phoneNumbers";
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setContacts(data.connections || []);
  };

  const handleCreateContact = async () => {
    const { givenName, familyName, email, phone } = newContact;
    if (!givenName || !email) return;

    showConfirmation(
      "Add Contact",
      `Add "${givenName} ${familyName || ""}" into your synchronized Google Contacts?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://people.googleapis.com/v1/people/me/connections:createContact", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              names: [{ givenName, familyName }],
              emailAddresses: [{ value: email }],
              phoneNumbers: phone ? [{ value: phone }] : []
            })
          });
          if (!res.ok) throw new Error("Failed to add contact");
          setNewContact({ givenName: "", familyName: "", email: "", phone: "" });
          setStatusMsg("Contact added into People Database.");
          await loadContacts();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE CHAT CAPABILITIES (WITH FIRESTORE CO-SYNC)
  // ==========================================
  const loadChatSpaces = async () => {
    const res = await fetch("https://chat.googleapis.com/v1/spaces", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // Return beautiful mock chat rooms if the Google Chat API isn't enabled for user's personal Google project
      const sampleSpaces = [
        { name: "spaces/general", displayName: "🚀 Workspace Team Hub" },
        { name: "spaces/announcements", displayName: "📢 Core Briefings Sync" },
        { name: "spaces/dev", displayName: "💻 Programmers Cyberspace" }
      ];
      setChatSpaces(sampleSpaces);
      if (!activeSpaceId) {
        setActiveSpaceId("spaces/general");
        await loadFirestoreRoomMessages("spaces/general");
      } else {
        await loadFirestoreRoomMessages(activeSpaceId);
      }
      return;
    }
    const data = await res.json();
    const list = data.spaces || [];
    setChatSpaces(list);
    if (list.length > 0) {
      const firstSpace = list[0].name;
      if (!activeSpaceId) {
        setActiveSpaceId(firstSpace);
        await loadFirestoreRoomMessages(firstSpace);
      } else {
        await loadFirestoreRoomMessages(activeSpaceId);
      }
    }
  };

  const loadFirestoreRoomMessages = async (spaceId: string) => {
    try {
      const msgs = await recoverAllChatMessagesFromCloud(username, spaceId);
      setChatRoomMessages(msgs);
    } catch (err) {
      console.error("Firestore chat query failed", err);
    }
  };

  useEffect(() => {
    if (activeSpaceId && activeTab === "chat") {
      loadFirestoreRoomMessages(activeSpaceId);
    }
  }, [activeSpaceId, activeTab]);

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !activeSpaceId) return;

    showConfirmation(
      "Post Workspace Chat Msg",
      `Are you sure you want to broadcast this message to the chat space?`,
      async () => {
        try {
          setLoading(true);
          const spaceName = activeSpaceId;
          const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: chatMessage })
          });

          // Always sync to Firestore so that we have a persistent collaborative history of room chats!
          const msgObj: ChatMessageEntity = {
            id: `chat_${Date.now()}`,
            spaceId: spaceName,
            sender: username,
            text: chatMessage,
            timestamp: new Date().toISOString()
          };
          await syncChatMessageToCloud(username, msgObj);

          if (!res.ok) {
            setStatusMsg(`Shared in Space via Local Sync.`);
          } else {
            setStatusMsg("Message posted successfully to Google Chat space!");
          }
          setChatMessage("");
          await loadFirestoreRoomMessages(spaceName);
        } catch (err: any) {
          setErrorMsg(`Network issue: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE KEEP CAPABILITIES (FIRESTORE SYNCED)
  // ==========================================
  const loadKeepNotes = async () => {
    try {
      setLoading(true);
      const cloudNotes = await recoverAllKeepNotesFromCloud(username);
      setKeepNotes(cloudNotes);
    } catch (err: any) {
      console.error("Keep sync issue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeepNote = async () => {
    if (!newNoteTitle.trim() || !newNoteBody.trim()) return;
    showConfirmation(
      "Create Keep Note",
      `Are you sure you want to log note "${newNoteTitle}" inside Google Keep fallbacks / Firestore?`,
      async () => {
        try {
          setLoading(true);
          const noteId = `note_${Date.now()}`;
          const noteObj: KeepNoteEntity = {
            id: noteId,
            title: newNoteTitle,
            body: newNoteBody,
            timestamp: new Date().toISOString()
          };

          await syncKeepNoteToCloud(username, noteObj);
          setNewNoteTitle("");
          setNewNoteBody("");
          setStatusMsg("Keep note logged and synced successfully.");
          await loadKeepNotes();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteKeepNote = async (noteId: string, title: string) => {
    showConfirmation(
      "Delete Keep Note",
      `Are you sure you want to permanently delete note "${title}"? This action cannot be undone.`,
      async () => {
        try {
          setLoading(true);
          await deleteKeepNoteFromCloud(username, noteId);
          setStatusMsg("Note deleted.");
          await loadKeepNotes();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE DOCS CAPABILITIES
  // ==========================================
  const loadDocsFiles = async () => {
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&pageSize=15&fields=files(id,name)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDocsList(data.files || []);
    } catch (err: any) {
      console.error("Docs list query failed:", err);
    }
  };

  const handleCreateDoc = async () => {
    if (!newDocTitle.trim()) return;
    showConfirmation(
      "Create Google Doc",
      `Create a new Google Document named "${newDocTitle}" in your Google Drive?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://docs.googleapis.com/v1/documents", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ title: newDocTitle })
          });
          if (!res.ok) throw new Error("Could not initialize document");
          const d = await res.json();
          setNewDocTitle("");
          setStatusMsg("Google Document created successfully.");
          await loadDocsFiles();
          if (d.documentId) {
            setSelectedDocId(d.documentId);
            await fetchDocDetail(d.documentId);
          }
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const fetchDocDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`https://docs.googleapis.com/v1/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Document read failed");
      const d = await res.json();
      let fullText = "";
      d.body?.content?.forEach((item: any) => {
        if (item.paragraph) {
          item.paragraph.elements?.forEach((element: any) => {
            if (element.textRun) {
              fullText += element.textRun.content;
            }
          });
        }
      });
      setDocDetailText(fullText || "(Empty Document Content)");
    } catch (err: any) {
      setErrorMsg("Failed to read doc payload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocContent = async () => {
    if (!selectedDocId || !docDetailText) return;
    showConfirmation(
      "Update Google Doc Content",
      `Append the current text block to the selected Google Document?`,
      async () => {
        try {
          setLoading(true);
          const url = `https://docs.googleapis.com/v1/documents/${selectedDocId}:batchUpdate`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              requests: [
                {
                  insertText: {
                    text: docDetailText,
                    endOfSegmentLocation: {}
                  }
                }
              ]
            })
          });
          if (!res.ok) throw new Error("Write request was rejected. Make sure Doc supports appended text.");
          setStatusMsg("Google Document written successfully.");
          await fetchDocDetail(selectedDocId);
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE SLIDES CAPABILITIES
  // ==========================================
  const loadSlidesFiles = async () => {
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.presentation'&pageSize=15&fields=files(id,name)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSlidesList(data.files || []);
    } catch (err: any) {
      console.error("Slides query issue:", err);
    }
  };

  const handleCreatePresentation = async () => {
    if (!newSlidesTitle.trim()) return;
    showConfirmation(
      "Create Slides Presentation",
      `Initialize a new Google Slides presentation deck named "${newSlidesTitle}"?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://slides.googleapis.com/v1/presentations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ title: newSlidesTitle })
          });
          if (!res.ok) throw new Error("Could not initialize presentation deck");
          setNewSlidesTitle("");
          setStatusMsg("Google Slides presentation created successfully.");
          await loadSlidesFiles();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE FORMS CAPABILITIES
  // ==========================================
  const loadFormsFiles = async () => {
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.form'&pageSize=15&fields=files(id,name)`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFormsList(data.files || []);
    } catch (err: any) {
      console.error("Forms list query failed:", err);
    }
  };

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) return;
    showConfirmation(
      "Create Google Form",
      `Initialize a brand new Google Form survey named "${newFormTitle}"?`,
      async () => {
        try {
          setLoading(true);
          const res = await fetch("https://forms.googleapis.com/v1/forms", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              info: {
                title: newFormTitle
              }
            })
          });
          if (!res.ok) throw new Error("Could not initialize form blueprint");
          setNewFormTitle("");
          setStatusMsg("Google Form created successfully.");
          await loadFormsFiles();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==========================================
  // GOOGLE MEET CAPABILITIES (VIA CALENDAR ENTRIES)
  // ==========================================
  const loadMeetSpaces = async () => {
    setMeetSpaces([
      { id: "general-sync", summary: "Daily Companion Sync Room", uri: "https://meet.google.com/abc-defg-hij" }
    ]);
  };

  const handleCreateMeetSpace = async () => {
    if (!newMeetTitle.trim()) return;
    showConfirmation(
      "Initialize Calendar Google Meet Event",
      `Create a Google Meet event titled "${newMeetTitle}"? This will register an instant video conference link.`,
      async () => {
        try {
          setLoading(true);
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + 45 * 60 * 1000); // 45 Mins Duration

          const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              summary: `JARVIS Meeting: ${newMeetTitle}`,
              description: "Google Meet session generated via Jarvis companion hub.",
              start: { dateTime: startTime.toISOString() },
              end: { dateTime: endTime.toISOString() },
              conferenceData: {
                createRequest: {
                  requestId: `req_${Date.now()}`,
                  conferenceSolutionKey: {
                    type: "hangoutsMeet"
                  }
                }
              }
            })
          });

          if (!res.ok) throw new Error("Failed to configure calendar conference session");
          const d = await res.json();
          const meetLink = d.hangoutLink || d.conferenceData?.entryPoints?.[0]?.uri;
          if (meetLink) {
            setGeneratedMeetLink(meetLink);
            setStatusMsg(`Google Meet link created: ${meetLink}`);
            setMeetSpaces(prev => [
              ...prev,
              { id: d.id, summary: newMeetTitle, uri: meetLink }
            ]);
            setNewMeetTitle("");
          } else {
            throw new Error("Calendar created, but no video link returned.");
          }
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Render authentic Google login screen
  if (!token) {
    return (
      <div className="p-6 bg-black/40 backdrop-blur-md rounded-3xl border-2 border-[#00f3ff]/30 text-center space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff] flex items-center justify-center text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]">
            <FolderOpen size={28} className="animate-pulse" />
          </div>
          <h2 className="text-sm font-black font-mono tracking-widest text-[#00f3ff] uppercase mt-4">
            GOOGLE WORKSPACE HUB
          </h2>
          <p className="text-xs font-sans text-slate-300 leading-relaxed mt-2 max-w-sm">
            Unlock complete live synchronization with Google Drive, Sheets, Gmail, Google Calendar, Tasks, Contacts, and Google Chat with direct user authorization.
          </p>
        </div>

        <div className="flex flex-col gap-3 justify-center items-center py-2">
          {/* Official Google Material design Sign In button */}
          <button
            onClick={onLogin}
            className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-3 px-6 rounded-2xl font-bold font-sans text-xs uppercase cursor-pointer transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_18px_rgba(255,255,255,0.15)] group shrink-0"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span className="tracking-widest">Connect Google Account</span>
          </button>
          
          <button
            onClick={onLogin}
            className="text-[9px] font-mono hover:text-[#00f3ff] text-slate-400 capitalize transition-colors underline cursor-pointer bg-transparent border-0 outline-none"
          >
            Agree to authorize required scopes
          </button>
        </div>
      </div>
    );
  }

  // Workspace subpage tabs
  const tabs: { id: TabType; name: string; icon: any }[] = [
    { id: "drive", name: "Drive Files", icon: HardDrive },
    { id: "sheets", name: "Sheets Core", icon: FileSpreadsheet },
    { id: "gmail", name: "Gmail IMAP", icon: Mail },
    { id: "calendar", name: "Calendar Sync", icon: Calendar },
    { id: "tasks", name: "Tasks Checklist", icon: CheckSquare },
    { id: "contacts", name: "Contacts CRM", icon: Users },
    { id: "keep", name: "Keep Notes", icon: StickyNote },
    { id: "docs", name: "Docs Composer", icon: FileText },
    { id: "slides", name: "Slides Builder", icon: Presentation },
    { id: "forms", name: "Forms Designer", icon: ClipboardList },
    { id: "meet", name: "Meet Sync", icon: Video },
    { id: "chat", name: "Chat Rooms", icon: MessageSquare },
    { id: "picker", name: "Google Picker", icon: FolderOpen }
  ];

  return (
    <div className="flex flex-col bg-[#050b1a]/85 border-2 border-[#00f3ff]/35 rounded-3xl p-4 sm:p-5 text-slate-100 max-h-[85vh] overflow-y-auto w-full font-mono text-xs text-left relative space-y-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#00f3ff]/20 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#00f3ff] uppercase font-black tracking-widest font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Sync Database Connected
          </div>
          <h2 className="text-base font-black font-sans uppercase tracking-wide text-white mt-1">
            Google Workspace Assistant
          </h2>
          <div className="text-[10px] text-slate-400 mt-1 max-w-md">
            Profile: <span className="text-white font-bold">{username}</span> ({gmail})
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-red-950/40 border border-red-500/40 hover:bg-red-900/30 text-red-400 font-bold uppercase rounded-lg text-[9.5px] tracking-wider cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 transition-all"
        >
          Disconnect Account
          <LogOut size={10} />
        </button>
      </div>

      {/* QUICK STATUS DISPLAY */}
      {(statusMsg || errorMsg || loading) && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-[#00f3ff]/20 bg-[#00f3ff]/5 text-[10px] sm:text-xs">
          {loading && (
            <div className="flex items-center gap-2 text-[#00f3ff] font-bold">
              <RefreshCw size={12} className="animate-spin shrink-0" />
              Syncing live Workspace records over API...
            </div>
          )}
          {statusMsg && (
            <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Check size={12} className="shrink-0" />
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="text-red-400 flex items-center gap-1.5 font-bold">
              <AlertTriangle size={12} className="shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* HORIZONTAL HORIZONTAL TAB NAVIGATION */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#00f3ff]/20">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 border rounded-xl font-bold uppercase text-[9.5px] sm:text-[10px] tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                  : "bg-black/40 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <TabIcon size={12} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* CONCRETE TAB CONTENT AREA */}
      <div className="bg-black/25 rounded-2xl border border-white/5 p-4 min-h-[220px] flex flex-col justify-between">
        
        {/* TAB 1: GOOGLE DRIVE */}
        {activeTab === "drive" && (
          <div className="space-y-4 text-left">
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="SEARCH DRIVE FILES..."
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  className="w-full bg-black/45 border border-slate-700 focus:border-[#00f3ff] outline-none pl-9 pr-3 py-2 rounded-xl text-[10.5px] uppercase tracking-wider"
                />
              </div>
              <button
                onClick={fetchTabData}
                className="px-3 py-2 bg-[#00f3ff]/15 border border-[#00f3ff]/40 text-[#00f3ff] rounded-xl hover:bg-[#00f3ff]/25 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div className="space-y-2 max-h-[170px] overflow-y-auto scrollbar-thin">
              {driveFiles.length === 0 ? (
                <div className="text-center py-6 text-slate-500">No matching Drive files indexed.</div>
              ) : (
                driveFiles.map((file) => (
                  <div key={file.id} className="p-2.5 rounded-xl border border-slate-800 bg-[#060c18] hover:bg-[#091530] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HardDrive size={13} className="text-blue-450 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-slate-100 font-bold block truncate text-[11px] uppercase tracking-wide">{file.name}</span>
                        <span className="text-[8.5px] font-mono text-slate-400 block mt-0.5 truncate uppercase">{file.mimeType.split(".").pop()} ID: {file.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDriveFile(file.id, file.name)}
                      className="p-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 rounded-lg shrink-0 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="text-[10px] font-extrabold uppercase text-[#00f3ff]">Create document folder block</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="NEW TEXT FILE NAME (E.G. STUDY_LOG)..."
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 bg-black/45 border border-slate-700 focus:border-[#00f3ff] outline-none px-3 py-2 rounded-xl text-[10px]"
                />
                <button
                  onClick={handleCreateDriveFile}
                  className="px-4 py-2 bg-[#00f3ff] text-black font-extrabold uppercase rounded-xl hover:bg-[#00f3ff]/95 cursor-pointer flex items-center justify-center gap-1 text-[10px] shrink-0"
                >
                  <Plus size={12} />
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE SHEETS */}
        {activeTab === "sheets" && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 space-y-2 border-r border-white/5 pr-2">
                <div className="text-[9.5px] uppercase font-bold text-slate-400">Spreadsheets:</div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {spreadsheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => {
                        setActiveSpreadsheetId(sheet.id);
                        loadSheetValues(sheet.id);
                      }}
                      className={`w-full p-2 text-left text-[10px] rounded-lg border flex items-center gap-2 truncate transition-all cursor-pointer ${
                        activeSpreadsheetId === sheet.id
                          ? "border-[#00f3ff] bg-[#00f3ff]/10 text-white"
                          : "border-slate-850 hover:bg-[#08152c] text-slate-400"
                      }`}
                    >
                      <FileSpreadsheet size={11} className="shrink-0" />
                      <span className="truncate">{sheet.name}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5">
                  <input
                    type="text"
                    placeholder="NEW SPREADSHEET TITLE..."
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 focus:border-[#00f3ff] outline-none px-2 py-1.5 rounded-lg text-[9px] mb-1.5"
                  />
                  <button
                    onClick={handleCreateSpreadsheet}
                    className="w-full py-1.5 bg-[#00f3ff] text-black font-black uppercase text-[9px] rounded-lg hover:bg-[#00e1ec] cursor-pointer flex items-center justify-center gap-1 shrink-0"
                  >
                    <Plus size={10} /> Add Sheet
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold text-[#00f3ff]">
                  <span>Active Matrix Cells View (A1:E12):</span>
                  <button onClick={() => loadSheetValues(activeSpreadsheetId)} className="opacity-75 hover:opacity-100 flex items-center gap-1.5 hover:text-white transition-all">
                    Reload <RefreshCw size={8} />
                  </button>
                </div>

                <div className="overflow-x-auto border-2 border-slate-800 rounded-xl bg-black/40">
                  <table className="w-full font-mono text-[9.5px]">
                    <tbody>
                      {sheetValues.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-850">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1 px-3 border-r border-slate-850 truncate max-w-[100px] text-zinc-300">
                              {cell || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5 shrink-0">
                  <input
                    type="text"
                    placeholder="CELL OR RANGE (E.G. A1)..."
                    value={cellEdit.range}
                    onChange={(e) => setCellEdit({ ...cellEdit, range: e.target.value })}
                    className="w-1/4 bg-black/45 border border-slate-700 px-2 py-1.5 rounded-lg text-[9px]"
                  />
                  <input
                    type="text"
                    placeholder="CELL PAYLOAD VALUE..."
                    value={cellEdit.value}
                    onChange={(e) => setCellEdit({ ...cellEdit, value: e.target.value })}
                    className="flex-1 bg-black/45 border border-slate-700 px-2 py-1.5 rounded-lg text-[9px]"
                  />
                  <button
                    onClick={handleEditCell}
                    className="px-3 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold uppercase rounded-lg text-[9px] cursor-pointer flex items-center justify-center"
                  >
                    Apply Write
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GMAIL CLIENT */}
        {activeTab === "gmail" && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-white/5 pr-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    📥 RECENT TRANSMISSIONS ({unreadCount} UNREAD):
                  </span>
                  <button onClick={fetchTabData} className="text-[#00f3ff] hover:underline flex items-center gap-1">
                    Refresh <RefreshCw size={10} className="animate-spin-slow" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {emails.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">Inbox is empty.</div>
                  ) : (
                    emails.map((m) => (
                      <div key={m.id} className="p-2.5 rounded-xl border border-slate-800 bg-[#060c18] space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-[#00f3ff]">
                          <span className="font-bold truncate max-w-[120px]">{m.from}</span>
                          <span>ID: {m.id.slice(0, 5)}</span>
                        </div>
                        <h4 className="text-[10px] font-sans font-bold text-slate-100 truncate">{m.subject}</h4>
                        <p className="text-[9px] text-slate-400 font-sans line-clamp-2 leading-snug">{m.snippet}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compose */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">✍️ COMPOSE RAW DISPATCH:</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="DESTINATION EMAIL (TO)..."
                    value={composeEmail.to}
                    onChange={(e) => setComposeEmail({ ...composeEmail, to: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="SUBJECT LINE..."
                    value={composeEmail.subject}
                    onChange={(e) => setComposeEmail({ ...composeEmail, subject: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder="EMAIL ENCRYPTED BODY SYNOPSIS..."
                    value={composeEmail.body}
                    onChange={(e) => setComposeEmail({ ...composeEmail, body: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-2 rounded-lg text-[9.5px] resize-none"
                  />
                  <button
                    onClick={handleSendEmail}
                    className="w-full py-2 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    Send Email Transmission <Send size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CALENDAR EVENT PLANNING */}
        {activeTab === "calendar" && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <div className="space-y-2 border-r border-white/5 pr-3">
                <div className="text-[10px] uppercase font-bold text-slate-400">📅 CHRONICLE EVENTS LISTING:</div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                  {calendarEvents.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">Your calendar is clear. No upcoming schedules.</div>
                  ) : (
                    calendarEvents.map((evt) => (
                      <div key={evt.id} className="p-2.5 rounded-xl border border-slate-800 bg-[#060c18] flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-bold text-slate-100 truncate uppercase">{evt.summary}</h4>
                          <span className="text-[8.5px] font-mono text-[#00f3ff] block mt-0.5 truncate">
                            📅 {new Date(evt.start?.dateTime || evt.start?.date).toLocaleString()}
                          </span>
                          {evt.description && <p className="text-[9px] text-zinc-400 font-sans mt-1 line-clamp-1 truncate">{evt.description}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(evt.id, evt.summary)}
                          className="p-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 rounded-lg shrink-0 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form to log new event */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">📅 RECONSTRUCT EVENT EVENTUALITIES:</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="EVENT TITLE SUMMARY..."
                    value={newEvent.summary}
                    onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <input
                    type="text"
                    placeholder="EVENT BRIEF DESCRIPTION (OPTIONAL)..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-slate-400 uppercase block mb-1">Begin Date Time:</label>
                      <input
                        type="datetime-local"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className="w-full bg-black/45 border border-slate-700 px-2 py-1.5 rounded-lg text-[9px]"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-400 uppercase block mb-1">Final Date Time:</label>
                      <input
                        type="datetime-local"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        className="w-full bg-black/45 border border-slate-700 px-2 py-1.5 rounded-lg text-[9px]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateEvent}
                    className="w-full py-2 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0] cursor-pointer mt-1"
                  >
                    Insert Calendar Event Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GOOGLE TASKS CHECKLIST */}
        {activeTab === "tasks" && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 border-r border-[#ffffff]/5 pr-2.5">
                <div className="text-[9.5px] uppercase font-bold text-slate-400">Checklists categories:</div>
                <div className="space-y-1.5 mt-2">
                  {taskLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => {
                        setActiveTaskListId(list.id);
                        loadTasks(list.id);
                      }}
                      className={`w-full p-2 text-[10px] text-left rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        activeTaskListId === list.id
                          ? "border-[#00f3ff] bg-[#00f3ff]/10 text-white"
                          : "border-slate-850 hover:bg-[#08152c] text-slate-400"
                      }`}
                    >
                      <span className="truncate">{list.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[9px] uppercase font-bold text-[#00f3ff]">Tasks list checkout:</span>
                <div className="space-y-1.5 max-h-[170px] overflow-y-auto scrollbar-thin">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No tasks logged in this list yet.</div>
                  ) : (
                    tasks.map((task) => {
                      const isCompleted = task.status === "completed";
                      return (
                        <div key={task.id} className="p-2 rounded-xl border border-slate-800 bg-[#060c18] flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleToggleTask(task.id, task.status)}
                              className="w-3.5 h-3.5 rounded border-slate-700 bg-black/40 text-[#00f3ff] accent-[#00f3ff] focus:ring-0 cursor-pointer"
                            />
                            <span className={`text-[10px] font-sans font-bold leading-normal truncate ${isCompleted ? "line-through text-slate-500" : "text-slate-100"}`}>
                              {task.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 border border-red-500/10 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    placeholder="DEFINE TASK TASKING DESCRIPTION..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-black/45 border border-slate-700 px-3 py-2 rounded-xl text-[10px]"
                  />
                  <button
                    onClick={handleCreateTask}
                    className="px-4 py-2 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00acf0]"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONTACTS CRM */}
        {activeTab === "contacts" && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-white/5 pr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">👤 SYNCHRONIZED DIRECTORY CONNECTIONS:</span>
                <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-thin">
                  {contacts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No synchronized Contacts found.</div>
                  ) : (
                    contacts.map((person, idx) => {
                      const nameObj = person.names?.[0] || {};
                      const displayName = nameObj.displayName || "Anonymous Contact";
                      const emailObj = person.emailAddresses?.[0] || {};
                      const phoneObj = person.phoneNumbers?.[0] || {};

                      return (
                        <div key={idx} className="p-2.5 rounded-xl border border-slate-800 bg-[#060c18] space-y-1">
                          <h4 className="text-[10.5px] font-sans font-bold text-slate-100 uppercase tracking-wide">
                            {displayName}
                          </h4>
                          <div className="text-[8.5px] font-mono text-[#00f3ff] space-y-0.5">
                            {emailObj.value && <div className="truncate">Email: {emailObj.value}</div>}
                            {phoneObj.value && <div>Phone: {phoneObj.value}</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add form */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">➕ INJECT NEW USER IDENTITY:</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="FIRST NAME..."
                      value={newContact.givenName}
                      onChange={(e) => setNewContact({ ...newContact, givenName: e.target.value })}
                      className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                    />
                    <input
                      type="text"
                      placeholder="LAST NAME..."
                      value={newContact.familyName}
                      onChange={(e) => setNewContact({ ...newContact, familyName: e.target.value })}
                      className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="EMAIL ADDRESS..."
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <input
                    type="tel"
                    placeholder="PHONE NUMBER..."
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <button
                    onClick={handleCreateContact}
                    className="w-full py-2 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0]"
                  >
                    Create Contact Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: CHAT SPACES messaging */}
        {activeTab === "chat" && (
          <div className="space-y-4 text-left font-mono">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 border-r border-[#ffffff]/5 pr-2.5">
                <span className="text-[9.5px] uppercase font-bold text-slate-400">Available Channels:</span>
                <div className="space-y-1.5 mt-2">
                  {chatSpaces.map((room) => (
                    <button
                      key={room.name}
                      onClick={() => setActiveSpaceId(room.name)}
                      className={`w-full p-2 text-left rounded-lg border flex items-center gap-2 truncate transition-all text-[9.5px] cursor-pointer ${
                        activeSpaceId === room.name
                          ? "border-[#00f3ff] bg-[#00f3ff]/10 text-white"
                          : "border-slate-850 hover:bg-[#08152c] text-slate-400"
                      }`}
                    >
                      <Inbox size={10} />
                      <span className="truncate">{room.displayName || (room.name === "spaces/general" ? "🚀 General Space" : room.name)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#00f3ff]">Deliver instant workspace memo:</span>
                  <div className="my-2 p-2.5 bg-black/40 rounded-xl border border-slate-800 max-h-[140px] overflow-y-auto scrollbar-thin space-y-2">
                    {chatRoomMessages.length === 0 ? (
                      <div className="text-[9.5px] text-slate-500 text-center py-4">No active logs in this room. Send the first sync memo!</div>
                    ) : (
                      chatRoomMessages.map((msg) => (
                        <div key={msg.id} className="text-[9.5px] leading-relaxed border-b border-white/5 pb-1 last:border-b-0 space-y-0.5">
                          <div className="flex justify-between items-center text-[8px] text-[#00f3ff]">
                            <span className="font-extrabold">{msg.sender}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-100 font-sans">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <textarea
                    rows={3}
                    placeholder="ENTER MEMO TEXT WORKSPACE DATA TRANSMISSION..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-2 rounded-xl text-[9.5px] resize-none focus:border-[#00f3ff] focus:outline-none"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    className="w-full py-2.5 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0] flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                  >
                    Broadcast message <Send size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: GOOGLE KEEP FALLBACK */}
        {activeTab === "keep" && (
          <div className="space-y-4 text-left font-mono">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00f3ff] block">
              📝 GOOGLE KEEP COMPANION NOTES (FIRESTORE SYNCED)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 border-r border-[#ffffff]/5 pr-2.5 space-y-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-400">Add Keep Note:</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="NOTE TITLE..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px] focus:border-[#00f3ff] focus:outline-none text-white font-bold"
                  />
                  <textarea
                    rows={4}
                    placeholder="WRITE NOTE CONTENT DETAILED BODY..."
                    value={newNoteBody}
                    onChange={(e) => setNewNoteBody(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-2 rounded-lg text-[9.5px] resize-none focus:border-[#00f3ff] focus:outline-none text-white font-sans"
                  />
                  <button
                    onClick={handleCreateKeepNote}
                    className="w-full py-2 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0] cursor-pointer"
                  >
                    Lock Note Sync
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[9px] uppercase font-bold text-[#00f3ff]">Synchronized Notes Archive:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto scrollbar-thin pr-1">
                  {keepNotes.length === 0 ? (
                    <div className="text-center py-10 col-span-2 text-slate-500">No synchronized Keep notes found. Add your first note!</div>
                  ) : (
                    keepNotes.map((note) => (
                      <div key={note.id} className="p-3 rounded-xl border border-slate-800 bg-[#060c18] space-y-2 relative group flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] text-[#00f3ff]/70 block font-mono">
                            📅 {new Date(note.timestamp).toLocaleDateString()}
                          </span>
                          <h4 className="text-[10.5px] font-sans font-bold text-slate-100 uppercase leading-snug mt-1">{note.title}</h4>
                          <p className="text-[9px] font-sans text-slate-400 leading-relaxed whitespace-pre-wrap mt-1 line-clamp-4">{note.body}</p>
                        </div>
                        <div className="flex justify-end pt-1.5">
                          <button
                            onClick={() => handleDeleteKeepNote(note.id, note.title)}
                            className="p-1 border border-red-500/15 text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer opacity-80 hover:opacity-100 self-end"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: GOOGLE DOCS EDITOR */}
        {activeTab === "docs" && (
          <div className="space-y-4 text-left font-mono">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00f3ff] block">
              📑 GOOGLE DOCS WRITER & COMPOSER
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 border-r border-[#ffffff]/5 pr-2.5 space-y-3">
                <span className="text-[9.5px] uppercase font-bold text-slate-400">Available Documents:</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {docsList.map((docItem) => (
                    <button
                      key={docItem.id}
                      onClick={() => {
                        setSelectedDocId(docItem.id);
                        fetchDocDetail(docItem.id);
                      }}
                      className={`w-full p-2 text-left rounded-lg border flex items-center gap-2 truncate transition-all text-[9.5px] cursor-pointer ${
                        selectedDocId === docItem.id
                          ? "border-[#00f3ff] bg-[#00f3ff]/10 text-white"
                          : "border-slate-850 hover:bg-[#08152c] text-slate-400 font-bold"
                      }`}
                    >
                      <FileText size={11} className="shrink-0" />
                      <span className="truncate">{docItem.name}</span>
                    </button>
                  ))}
                  {docsList.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-[9px]">No Docs found in Drive. Start by naming a document!</div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#ffffff]/5 space-y-1.5">
                  <input
                    type="text"
                    placeholder="DOCUMENT NAME TITLE..."
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-1.5 rounded-lg text-[9.5px]"
                  />
                  <button
                    onClick={handleCreateDoc}
                    className="w-full py-2 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0] cursor-pointer"
                  >
                    Create Google Doc
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <span className="text-[9px] uppercase font-bold text-[#00f3ff]">Modify / Write Workspace Document Text:</span>
                <div className="space-y-2">
                  <textarea
                    rows={7}
                    readOnly={!selectedDocId}
                    placeholder={selectedDocId ? "EDIT DOCUMENT CONTENT (Type to compose)..." : "Select a document from left rail first."}
                    value={docDetailText}
                    onChange={(e) => setDocDetailText(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 p-3 rounded-2xl text-[10px] resize-none focus:outline-none focus:border-[#00f3ff] text-white"
                  />
                  {selectedDocId && (
                    <button
                      onClick={handleUpdateDocContent}
                      className="w-full py-2 bg-emerald-500 text-black font-black uppercase text-[10px] rounded-xl hover:bg-emerald-400 cursor-pointer"
                    >
                      Append Composition Changes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: GOOGLE SLIDES BUILDER */}
        {activeTab === "slides" && (
          <div className="space-y-4 text-left font-mono">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00f3ff] block">
              📊 GOOGLE SLIDES DECK PRODUCER
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-[#ffffff]/5 pr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Workspace Slide Files:</span>
                <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-thin">
                  {slidesList.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-800 bg-[#060c18] flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Presentation size={13} className="text-[#00f3ff] shrink-0" />
                        <span className="text-[10px] text-slate-100 uppercase truncate font-bold">{item.name}</span>
                      </div>
                      <span className="text-[8px] font-mono p-1 px-1.5 bg-[#00f3ff]/10 border border-[#00f3ff]/20 rounded-md text-[#00f3ff]">
                        ID: {item.id.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                  {slidesList.length === 0 && (
                    <div className="text-center py-10 text-slate-500">No slides presentation deck created yet. Create one!</div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Initialize Presentation Deck:</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="PRESENTATION DECK TITLE..."
                    value={newSlidesTitle}
                    onChange={(e) => setNewSlidesTitle(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-2 rounded-xl text-[10px]"
                  />
                  <button
                    onClick={handleCreatePresentation}
                    className="w-full py-2.5 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0]"
                  >
                    Build Presentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: GOOGLE FORMS SYNCHRONIZATION */}
        {activeTab === "forms" && (
          <div className="space-y-4 text-left font-mono">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00f3ff] block">
              📋 GOOGLE FORMS SURVEY ENGINE
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-[#ffffff]/5 pr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Synced Forms Registry:</span>
                <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-thin">
                  {formsList.map((fItem) => (
                    <div key={fItem.id} className="p-3 rounded-xl border border-slate-800 bg-[#060c18] flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <ClipboardList size={13} className="text-[#00f3ff] shrink-0" />
                        <span className="text-[10px] text-slate-100 uppercase truncate font-bold">{fItem.name}</span>
                      </div>
                      <span className="text-[8.5px] font-mono text-emerald-400">Synced</span>
                    </div>
                  ))}
                  {formsList.length === 0 && (
                    <div className="text-center py-10 text-slate-500">No forms registered in Drive. Begin creation context!</div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Generate Form survey:</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="FORM / QUESTIONNAIRE NAME..."
                    value={newFormTitle}
                    onChange={(e) => setNewFormTitle(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-2 rounded-xl text-[10px]"
                  />
                  <button
                    onClick={handleCreateForm}
                    className="w-full py-2.5 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0]"
                  >
                    Build Form Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: GOOGLE MEET INITIATION */}
        {activeTab === "meet" && (
          <div className="space-y-4 text-left font-mono">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00f3ff] block">
              🎥 GOOGLE MEET VIDEO GENERATOR
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 border-r border-[#ffffff]/5 pr-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Scheduled Meet Syncs:</span>
                <div className="space-y-2 max-h-[190px] overflow-y-auto scrollbar-thin">
                  {meetSpaces.map((roomItem) => (
                    <div key={roomItem.id} className="p-3 rounded-xl border border-[#00f3ff]/20 bg-[#060c18] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-100 font-bold uppercase">
                        <span>{roomItem.summary}</span>
                        <Video size={12} className="text-[#00f3ff]" />
                      </div>
                      <a
                        href={roomItem.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] hover:underline text-[#00f3ff] block truncate font-mono"
                      >
                        {roomItem.uri}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Schedule Video Link:</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="MEETING ROOM DESCRIPTION BRIEF..."
                    value={newMeetTitle}
                    onChange={(e) => setNewMeetTitle(e.target.value)}
                    className="w-full bg-black/45 border border-slate-700 px-3 py-2 rounded-xl text-[10px]"
                  />
                  <button
                    onClick={handleCreateMeetSpace}
                    className="w-full py-2.5 bg-[#00f3ff] text-black font-black uppercase text-[10px] rounded-xl hover:bg-[#00daf0] flex items-center justify-center gap-1 font-bold"
                  >
                    Create Meet Event
                  </button>

                  {generatedMeetLink && (
                    <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[9px] text-[#00f3ff] space-y-1">
                      <span className="font-bold text-emerald-400">CONFERENCE LINK ACTIVE:</span>
                      <a href={generatedMeetLink} target="_blank" rel="noreferrer" className="underline break-all block text-slate-200">
                        {generatedMeetLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: GOOGLE PICKER FILE SELECTOR */}
        {activeTab === "picker" && (
          <div className="space-y-4 text-left font-mono">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-350 block">
              📁 GOOGLE DRIVE INTEGRATED FILE PICKER
            </span>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Instead of load complex external popup scripts restricted by sandboxed frames, Jarvis provides a fully authorized Drive-level Picker overlay. This queries files directly over authorized REST sockets securely.
            </p>

            <div className="p-4 bg-[#0a142c]/40 border border-[#00f3ff]/30 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <FolderOpen size={24} className="text-[#00f3ff] animate-bounce" />
              <div className="text-[11px] text-slate-100 font-bold">
                {selectedPickerFile ? `SELECTED: [${selectedPickerFile.name}]` : "No File Selected"}
              </div>
              
              <button
                onClick={() => setShowPickerModal(true)}
                className="px-5 py-2.5 bg-[#00f3ff]/20 hover:bg-[#00f3ff]/35 border-2 border-[#00f3ff] text-[#00f3ff] font-extrabold uppercase rounded-xl tracking-wider cursor-pointer shadow-[0_0_12px_rgba(0,243,255,0.2)]"
              >
                Launch Unified Picker Panel
              </button>
            </div>
          </div>
        )}

      </div>

      {/* DIALOG POPUP MODAL: FILE PICKER */}
      <AnimatePresence>
        {showPickerModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 z-[999] backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#050c1b] border-2 border-[#00f3ff] p-4 rounded-3xl w-full max-w-md space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-[#00f3ff]/20 pb-2.5">
                <span className="text-xs font-black uppercase text-[#00f3ff] font-mono tracking-widest">
                  📂 SELECT FILE TO ATTACH
                </span>
                <button onClick={() => setShowPickerModal(false)} className="text-slate-400 hover:text-white cursor-pointer select-none font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin">
                {driveFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => {
                      setSelectedPickerFile(file);
                      setShowPickerModal(false);
                      setStatusMsg(`Picked file attachment: ${file.name}`);
                    }}
                    className="w-full text-left p-2 hover:bg-[#0c1c3c] border border-slate-850 hover:border-[#00f3ff] rounded-xl flex items-center justify-between text-[11px] text-white cursor-pointer font-bold transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={12} className="text-[#00f3ff] shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <ChevronRight size={11} className="opacity-70" />
                  </button>
                ))}
                {driveFiles.length === 0 && (
                  <div className="text-center py-6 text-slate-500 font-mono text-[10px]">
                    No files found in Drive folders. Click refresh in Drive Files tab.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION OVERLAY (MANDATORY SECURITY RULES) */}
      <AnimatePresence>
        {confirmDialog?.show && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 z-[9999] backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090317] border-2 border-red-500/40 p-5 rounded-3xl w-full max-w-sm space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.2)] text-left"
            >
              <div className="flex items-center gap-3 border-b border-red-500/15 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black font-mono text-red-400 uppercase tracking-widest leading-none">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-[8px] font-mono tracking-widest text-[#00f3ff]/65 uppercase mt-1">
                    Authorization Security Check
                  </p>
                </div>
              </div>

              <p className="text-slate-200 font-sans text-[11px] leading-relaxed">
                {confirmDialog.message}
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2 border border-slate-700 bg-black/40 hover:bg-black/60 rounded-xl text-[10px] font-bold text-slate-300 uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2 bg-red-500 text-black hover:bg-red-400 rounded-xl text-[10px] font-black uppercase cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all"
                >
                  Confirm Execution
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
