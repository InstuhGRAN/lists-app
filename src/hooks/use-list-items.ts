import { useCallback, useEffect, useId, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { ListItemRow } from '@/types';

function bySiblingOrder(items: ListItemRow[], parentId: string | null) {
  return items
    .filter((item) => item.parent_item_id === parentId && !item.is_checked)
    .sort((a, b) => a.position - b.position);
}

export function useListItems(listId: string) {
  const [items, setItems] = useState<ListItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const instanceId = useId();

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
      .channel(`list-items-${listId}-${instanceId}`)
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
  }, [listId, refresh, instanceId]);

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

  // Checking/unchecking a parent applies the same state to all of its
  // sub-items, so a group always ends up fully checked or fully unchecked.
  const toggleItem = useCallback(
    async (id: string, isChecked: boolean) => {
      const childIds = items.filter((item) => item.parent_item_id === id).map((item) => item.id);
      const { error } = await supabase
        .from('list_items')
        .update({ is_checked: isChecked })
        .in('id', [id, ...childIds]);
      if (!error) await refresh();
      return error;
    },
    [items, refresh],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('list_items').delete().eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  // Swipe-right: nest this item under the one directly above it. Only one
  // level of nesting is supported, so an item with its own sub-items can't
  // itself be nested, and there must be a top-level item above it to nest under.
  const indentItem = useCallback(
    async (id: string) => {
      const topLevel = bySiblingOrder(items, null);
      const index = topLevel.findIndex((item) => item.id === id);
      if (index <= 0) return;

      const item = topLevel[index];
      const hasChildren = items.some((i) => i.parent_item_id === item.id);
      if (hasChildren) return;

      const newParent = topLevel[index - 1];
      const newParentChildren = bySiblingOrder(items, newParent.id);

      const { error } = await supabase
        .from('list_items')
        .update({ parent_item_id: newParent.id, position: newParentChildren.length })
        .eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [items, refresh],
  );

  // Swipe-right on an already-nested item: pop it back out to top level.
  const outdentItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !item.parent_item_id) return;

      const topLevel = bySiblingOrder(items, null);
      const { error } = await supabase
        .from('list_items')
        .update({ parent_item_id: null, position: topLevel.length })
        .eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [items, refresh],
  );

  // Persists a full new order for one sibling group (top-level items, or one
  // parent's sub-items) after a drag-to-reorder gesture settles.
  const reorderSiblings = useCallback(
    async (orderedIds: string[]) => {
      const updates = orderedIds.map((itemId, index) => ({ id: itemId, position: index }));
      const { error } = await supabase.from('list_items').upsert(updates);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  return {
    items,
    loading,
    addItem,
    updateLabel,
    toggleItem,
    deleteItem,
    indentItem,
    outdentItem,
    reorderSiblings,
  };
}
