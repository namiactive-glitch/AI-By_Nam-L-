export interface Character {
  name: string;
  role: string;
  description: string; // Detailed visual description
  image: string | null; // Base64 string for preview
  voiceGender?: string;
  voiceAge?: string;
  voiceRegion?: string;
  voiceType?: string; // New field for delivery style (e.g., Advertising, Storytelling)
}

export interface ScriptLine {
  character: string;
  dialogue: string;
  action: string;
}

export interface VeoPrompt {
  type: string;
  prompt: string;
  dialogue_segment: string; // The specific 8s dialogue for this shot
}

export interface SoundDesign {
  music: string;
  sfx: string;
}

export interface GeneratedData {
  title: string;
  synopsis: string;
  script: ScriptLine[];
  veo_prompts: VeoPrompt[];
  sound_design: SoundDesign;
}

export interface Theme {
  id: string;
  label: string;
  icon: string;
}

export interface StyleOption {
  id: string;
  label: string;
  desc: string;
  color: string;
}

export interface ScriptTone {
  id: string;
  label: string;
  desc: string;
  instruction: string; // Instruction for the AI
}

export interface ImageAsset {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export type InteractionMode = 'wear' | 'hold';
