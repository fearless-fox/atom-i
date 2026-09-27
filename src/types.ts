/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Atom {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  duration?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  completed: boolean;
  tools?: string[];
  deliverable?: string;
  atoms?: Atom[];
  urgency: 'Urgent' | 'Not Urgent';
  importance: 'Important' | 'Not Important';
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  duration?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  milestones?: string[];
  completed: boolean;
  tasks: Task[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  timeline?: string;
  insight?: string;
  encouragement?: string;
  resources?: string[];
  completed: boolean;
  progress: number;
  phases: Phase[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startHour: number; // 0-23
  endHour: number;
  priority: 'high' | 'medium' | 'low';
  category: 'general' | 'work' | 'personal' | 'health' | 'learning' | 'creative';
  completed: boolean;
  sourceTaskId?: string; // Links back to the decomposed task if applicable
  googleCalendarEventId?: string; // Synced Google Calendar event ID
  googleCalendarHtmlLink?: string; // Web link to view in Google Calendar
  syncedAt?: string; // ISO timestamp
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  colorId?: string;
}

export type UserTier =
  | 'trial' // legacy / operative
  | 'package_1' // legacy
  | 'package_2' // legacy
  | 'package_3' // legacy
  | 'operative' // Free $0
  | 'tactical_pro' // $15/mo
  | 'vanguard_live' // $39/mo
  | 'founder_lifetime'; // $99 one-time (first 199 operators)

export interface UserProfile {
  uid: string;
  tier: UserTier;
  atomizationLimit: number;
  hasCalendar: boolean;
  hasGrid: boolean;
  hasLiveVoice: boolean;
  voiceMinutesRemaining: number;
  isFounderLifetime?: boolean;
  isCreator?: boolean; // App Creator / Master Architect (#000 Genesis Pass)
  hasTeams: boolean;
  teamLimit?: number;
  featuredEligible?: boolean;
  email?: string;
  displayName?: string;
  preferredEngine?: 'puter' | 'gemini';
  founderNumber?: number;
  founderPromoCodeUsed?: string;
  founderMerchClaimed?: boolean;
  founderMerchDetails?: {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    notes?: string;
    date: string;
  };
  isVipPromo?: boolean;
  founderDiscountPercent?: number;
  activeDiscountCode?: string;
  redeemedPromoCodes?: string[];
}

export interface SuccessStory {
  id: string;
  authorName: string;
  goalTitle: string;
  isApproved: boolean;
  quote: string;
  stepsCompleted: string[];
  userId: string;
}

export interface TeamGroup {
  id: string;
  teamName: string;
  ownerId: string;
  members: string[];
  maxMembers: number;
}

