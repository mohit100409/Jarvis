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
  savedMemoryText?: string;
}


