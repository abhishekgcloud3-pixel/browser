// Environment configuration types

export interface EnvConfig {
  youtubeApiKey: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
}