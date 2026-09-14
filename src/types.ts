export type ListKind = 'travel' | 'grocery' | 'custom';

export interface ListRow {
  id: string;
  user_id: string;
  title: string;
  kind: ListKind;
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
