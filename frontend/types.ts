export enum Sender {
  User = 'user',
  AI = 'model',
  System = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  hasAttachment?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export type ToolType = 'pen' | 'select';

export interface DrawLine {
  tool: ToolType;
  points: Point[];
  color: string;
  width: number;
}

// Gemini specific types used in service
export interface VisionRequest {
  text: string;
  imageBase64?: string; // Clean base64 without header
}
