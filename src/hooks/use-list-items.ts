import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { ListItemRow } from '@/types';

export function useListItems(listId: string) {
  const [items, setItems] = useState<ListItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true });
    if (!error && data) setItems(data as ListItemRow[]);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel(`list-items-${listId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${listId}` },
        () => {
          refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, refresh]);

  const addItem = useCallback(
    async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const { error } = await supabase
        .from('list_items')
        .insert({ list_id: listId, label: trimmed, position: items.length });
      if (!error) await refresh();
      return error;
    },
    [listId, items.length, refresh],
  );

  const updateLabel = useCallback(
    async (id: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('list_items').update({ label: trimmed }).eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const toggleItem = useCallback(
    async (id: string, isChecked: boolean) => {
      const { error } = await supabase
        .from('list_items')
        .update({ is_checked: isChecked })
        .eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('list_items').delete().eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  return { items, loading, addItem, updateLabel, toggleItem, deleteItem };
}
