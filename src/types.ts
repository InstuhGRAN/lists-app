export type ListKind = 'travel' | 'grocery' | 'custom';

export interface ListRow {
  id: string;
  user_id: string;
  title: string;
  kind: ListKind;
  icon: string | null;
  background_color: string | null;
  background_image_path: string | null;
  created_at: string;
}

export interface ListItemRow {
  id: string;
  list_id: string;
  label: string;
  is_checked: boolean;
  position: number;
  created_at: string;
}

export const LIST_KINDS: { value: ListKind; label: string; icon: string }[] = [
  { value: 'travel', label: 'Travel', icon: 'airplane' },
  { value: 'grocery', label: 'Grocery', icon: 'cart' },
  { value: 'custom', label: 'Custom', icon: 'list' },
];

export const DEFAULT_CUSTOM_ICON = 'list';

// Icon choices offered for Custom lists (Travel/Grocery always use their fixed icon).
export const CUSTOM_LIST_ICONS: string[] = [
  'list',
  'star',
  'heart',
  'home',
  'briefcase',
  'gift',
  'book',
  'school',
  'fitness',
  'restaurant',
  'car',
  'paw',
  'musical-notes',
  'game-controller',
  'medkit',
  'wallet',
  'camera',
  'film',
  'bicycle',
  'basketball',
  'flower',
  'build',
  'construct',
  'sparkles',
];

// A Keep-style pastel palette. Text/icons on these are always dark, so
// contrast holds regardless of theme.
export const LIST_BACKGROUND_COLORS: { label: string; value: string }[] = [
  { label: 'Coral', value: '#FAAFA8' },
  { label: 'Peach', value: '#F39F76' },
  { label: 'Sand', value: '#FFF8B8' },
  { label: 'Mint', value: '#E2F6D3' },
  { label: 'Sage', value: '#B4DDD3' },
  { label: 'Fog', value: '#D4E4ED' },
  { label: 'Storm', value: '#AECCDC' },
  { label: 'Dusk', value: '#D3BFDB' },
  { label: 'Blossom', value: '#F6E2DD' },
  { label: 'Clay', value: '#E9E3D4' },
];
