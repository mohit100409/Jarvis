export interface Message {
  id: string;
  sender: "user" | "jarvis";
  text: string;
  attachment?: string;
  attachmentType?: string;
  modelUsed?: string;
  timestamp: string;
  emotion?: string;
  automationType?: "send-message" | "check-emails" | "automation-task";
  automationPayload?: any;
  generationType?: "image" | "video" | "canvas";
  generationStatus?: "generating" | "success";
  generationPrompt?: string;
  generationStyle?: string;
  generationResultUrl?: string;
  videoDuration?: string;
  videoMotion?: string;
  canvasTab?: "coding" | "writing" | "slides" | "export";
  canvasCodeText?: string;
  canvasWritingText?: string;
  canvasSlides?: Array<{ title: string; bullets: string[] }>;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface StudyTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface CreatorAsset {
  id: string;
  type: "image" | "video";
  prompt: string;
  url: string;
  timestamp: string;
}
