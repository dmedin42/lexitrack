export type WordErrorType = 'correct' | 'substitution' | 'mispronunciation' | 'omission' | 'insertion';

export interface PhonemeDetail {
  phoneme: string;
  expected: string;
  quality: number; // 0-100
}

export interface WordAssessment {
  word: string;
  errorType: WordErrorType;
  detectedWord?: string;
  phonemes?: PhonemeDetail[];
  confidence: number;
  offsetMs: number;
  durationMs: number;
  vouched?: boolean;
}

export interface ReadingAssessment {
  id: string;
  date: string;
  passageTitle: string;
  words: WordAssessment[];
  fluencyScore: number; // WPM
  accuracyScore: number; // 0-100
  duration: number; // seconds
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  assessments: ReadingAssessment[];
  benchmarkWPM: number;
}

export interface InterventionCluster {
  id: string;
  errorPattern: string;
  description: string;
  studentIds: string[];
  severity: 'high' | 'medium' | 'low';
  suggestedActivity: string;
}
