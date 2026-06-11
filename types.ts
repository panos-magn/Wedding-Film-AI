
export type ProjectStatus = 'booked' | 'pre_production' | 'event_day' | 'editing' | 'review' | 'delivered';

export interface Deliverables {
  highlightFilm: boolean;
  fullFilm: boolean;
  socialMediaContent: boolean;
  usbBox: boolean;
  onlineLink: boolean;
}

export interface PaymentStatus {
  totalAmount: number;
  depositPaid: boolean;
  balancePaid: boolean;
  packageName: string;
}

export interface Project {
  id: string;
  coupleNames: string;
  weddingDate: string;
  location: string;
  style: string;
  status: ProjectStatus;
  notes: string;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  payments: PaymentStatus;
  deliverables: Deliverables;
  deadline: string;
  createdAt: string;
}

export interface AIResult {
  id: string;
  projectId: string;
  moduleType: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  pdf_url: string;
  number: string;
}

export interface UserProfile {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoUrl?: string;
  contractTemplate: string;
  role?: 'user' | 'admin';
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  subscriptionExpiresAt?: string;
  stripeCustomerId?: string;
  customGeminiApiKey?: string;
}

export type AIModuleType = 
  | 'shot-planning'
  | 'pre-after-wedding'
  | 'storytelling'
  | 'scripts-vo'
  | 'editing-assistant'
  | 'highlight-reel'
  | 'color-grading'
  | 'audio-music'
  | 'social-media'
  | 'client-comm'
  | 'timeline-workflow';

export interface AIModuleConfig {
  id: AIModuleType;
  title: string;
  icon: string;
  description: string;
  prompt: string;
  inputs: { key: string; label: string; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
}
