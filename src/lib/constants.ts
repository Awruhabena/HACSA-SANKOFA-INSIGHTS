export interface CountryOption {
  value: string;
  label: string;
  group: string;
}

export const COUNTRIES: CountryOption[] = [
  // Ghana
  { value: 'Ghana', label: 'Ghana', group: 'Ghana' },
  // Africa
  { value: 'Nigeria', label: 'Nigeria', group: 'Africa' },
  { value: 'Kenya', label: 'Kenya', group: 'Africa' },
  { value: 'South Africa', label: 'South Africa', group: 'Africa' },
  { value: 'Senegal', label: 'Senegal', group: 'Africa' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire', group: 'Africa' },
  { value: 'Togo', label: 'Togo', group: 'Africa' },
  { value: 'Benin', label: 'Benin', group: 'Africa' },
  { value: 'Burkina Faso', label: 'Burkina Faso', group: 'Africa' },
  { value: 'Ethiopia', label: 'Ethiopia', group: 'Africa' },
  { value: 'Tanzania', label: 'Tanzania', group: 'Africa' },
  { value: 'Uganda', label: 'Uganda', group: 'Africa' },
  { value: 'Rwanda', label: 'Rwanda', group: 'Africa' },
  { value: 'Morocco', label: 'Morocco', group: 'Africa' },
  { value: 'Egypt', label: 'Egypt', group: 'Africa' },
  { value: 'Other African country', label: 'Other African country', group: 'Africa' },
  // Diaspora
  { value: 'United States', label: 'United States', group: 'Diaspora' },
  { value: 'United Kingdom', label: 'United Kingdom', group: 'Diaspora' },
  { value: 'Canada', label: 'Canada', group: 'Diaspora' },
  { value: 'Jamaica', label: 'Jamaica', group: 'Diaspora' },
  { value: 'Trinidad and Tobago', label: 'Trinidad and Tobago', group: 'Diaspora' },
  { value: 'Barbados', label: 'Barbados', group: 'Diaspora' },
  { value: 'Brazil', label: 'Brazil', group: 'Diaspora' },
  { value: 'France', label: 'France', group: 'Diaspora' },
  { value: 'Germany', label: 'Germany', group: 'Diaspora' },
  { value: 'Netherlands', label: 'Netherlands', group: 'Diaspora' },
  { value: 'Other Caribbean', label: 'Other Caribbean', group: 'Diaspora' },
  { value: 'Other Europe', label: 'Other Europe', group: 'Diaspora' },
  { value: 'Other (rest of world)', label: 'Other (rest of world)', group: 'Diaspora' },
];

export const HERITAGE_COUNTRIES: CountryOption[] = [
  ...COUNTRIES,
  { value: 'Prefer not to say', label: 'Prefer not to say', group: '' },
];

export const INDUSTRIES = [
  'Arts & Creative',
  'Education',
  'Technology',
  'Finance & Business',
  'Government & Public Sector',
  'Healthcare',
  'Tourism & Hospitality',
  'Media & Communications',
  'Non-profit / NGO',
  'Student',
  'Other',
] as const;

export const OCCUPATION_STATUSES = [
  'Student',
  'Professional',
  'Entrepreneur',
  'Retired',
  'Other',
] as const;

export type RegionType = 'local_ghana' | 'continental_africa' | 'diaspora';

export const REGION_TYPE_LABELS: Record<RegionType, string> = {
  local_ghana: 'Local (Ghana)',
  continental_africa: 'Continental Africa',
  diaspora: 'Diaspora',
};

export const REGION_TYPE_COLOURS: Record<RegionType, string> = {
  local_ghana: '#A63D2F',
  continental_africa: '#C8963E',
  diaspora: '#6B7A5E',
};

/** Helper: group COUNTRIES into optgroup-friendly structure */
export function getCountryGroups(countries: CountryOption[]) {
  const groups: { label: string; options: { value: string; label: string }[] }[] = [];
  const seen = new Set<string>();

  for (const c of countries) {
    const groupLabel = c.group || 'Other';
    if (!seen.has(groupLabel)) {
      seen.add(groupLabel);
      groups.push({
        label: groupLabel,
        options: countries
          .filter((o) => (o.group || 'Other') === groupLabel)
          .map((o) => ({ value: o.value, label: o.label })),
      });
    }
  }
  return groups;
}

/**
 * Shared email format check.
 * Kept here (rather than duplicated per form) so the registration and
 * feedback forms can never drift apart on what counts as a valid email —
 * they must agree, because feedback is matched to a registration by email.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/**
 * Detects definitively-mistyped email domains and blocks submission until
 * corrected.
 *
 * Deliberately uses an explicit list of known-impossible typos rather than
 * fuzzy string matching. Fuzzy matching (e.g. Levenshtein distance) would
 * flag real-but-uncommon domains — "email.com" and "all.com" are genuine
 * domains one character away from "mail.com" and "aol.com" — and blocking
 * a real attendee at the door of a live event is far worse than letting an
 * occasional typo through. Every entry below is a string that cannot be a
 * legitimate domain, so a false positive is impossible by construction.
 *
 * This is a DATA QUALITY measure, not a security control. It prevents honest
 * mistakes that would otherwise break the link between someone's registration
 * and their feedback. It does not, and is not intended to, stop deliberate
 * misuse — a bad actor simply types a well-formed address.
 *
 * Returns the corrected domain if a known typo is found, otherwise null.
 */
const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  // gmail.com
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmailc.om': 'gmail.com',
  // yahoo.com
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.om': 'yahoo.com',
  // hotmail.com
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmail.om': 'hotmail.com',
  // outlook.com
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outook.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.om': 'outlook.com',
  // icloud.com
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'icloud.cm': 'icloud.com',
  // aol.com
  'aol.con': 'aol.com',
  'aol.cm': 'aol.com',
  // live.com
  'live.con': 'live.com',
  'live.cm': 'live.com',
};

export function checkEmailDomainTypo(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at === -1) return null;

  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return null;

  return EMAIL_DOMAIN_TYPOS[domain] ?? null;
}
