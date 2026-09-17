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
