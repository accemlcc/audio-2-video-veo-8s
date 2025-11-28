export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AudioFile {
  name: string;
  type: string;
  base64: string;
  url: string;
}

export interface GenerationResult {
  videoUri: string | null;
  prompt: string;
}

// Augment the global AIStudio interface with the required methods.
// The window.aistudio property is already defined in the environment with type AIStudio.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}