import { useCallback, useEffect, useId, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { ListKind, ListRow } from '@/types';

export function useLists(scope: 'active' | 'archived' = 'active') {
  const { session } = useAuth();
  const [lists, setLists] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const instanceId = useId();

  const refresh = useCallback(async () => {
    if (!session) return;
    let query = supabase.from('lists').select('*').order('created_at', { ascending: false });
    query = scope === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null);
    const { data, error } = await query;
    if (!error && data) setLists(data as ListRow[]);
    setLoading(false);
  }, [session, scope]);

  useEffect(() => {
    refresh();

    if (!session) return;
    const channel = supabase
      .channel(`lists-changes-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refresh, instanceId]);

  const createList = useCallback(
    async (title: string, kind: ListKind, icon?: string | null) => {
      if (!session) return { message: 'Not signed in.' };
      const { error } = await supabase
        .from('lists')
        .insert({ title, kind, icon: icon ?? null, user_id: session.user.id });
      if (!error) await refresh();
      return error;
    },
    [session, refresh],
  );

  const updateListTitle = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('lists').update({ title: trimmed }).eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const updateListIcon = useCallback(
    async (id: string, icon: string) => {
      const { error } = await supabase.from('lists').update({ icon }).eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const updateListBackground = useCallback(
    async (id: string, background: { color: string | null; imagePath: string | null }) => {
      const { error } = await supabase
        .from('lists')
        .update({ background_color: background.color, background_image_path: background.imagePath })
        .eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const archiveList = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('lists')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const restoreList = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('lists').update({ archived_at: null }).eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  const deleteList = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('lists').delete().eq('id', id);
      if (!error) await refresh();
      return error;
    },
    [refresh],
  );

  return {
    lists,
    loading,
    createList,
    updateListTitle,
    updateListIcon,
    updateListBackground,
    archiveList,
    restoreList,
    deleteList,
    refresh,
  };
}
