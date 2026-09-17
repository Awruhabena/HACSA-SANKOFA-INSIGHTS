import type { RegionType } from './constants';

export interface Person {
  id: string;
  full_name: string;
  email: string;
  current_country: string;
  region_type: RegionType;
  heritage_country: string | null;
  industry: string;
  occupation_status: string;
  organization: string | null;
  consent_data: boolean;
  consent_marketing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string;
  event_date: string;
  is_published: boolean;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  person_id: string;
  registered_at: string;
}

export interface Feedback {
  id: string;
  event_id: string;
  person_id: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  what_stood_out: string | null;
  what_to_improve: string | null;
  submitted_at: string;
}

export interface RegistrationFormData {
  full_name: string;
  email: string;
  current_country: string;
  heritage_country: string;
  industry: string;
  occupation_status: string;
  organization: string;
  consent_data: boolean;
  consent_marketing: boolean;
}

export interface FeedbackFormData {
  email: string;
  rating: number;
  what_stood_out: string;
  what_to_improve: string;
}
