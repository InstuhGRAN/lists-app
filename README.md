# Lists

A cross-platform (iOS + Android) checklist app built with Expo / React Native. Built for
travel checklists and grocery lists, with cloud sync across devices.

- **Cross-platform**: one codebase, runs on iOS, Android, and web (via Expo).
- **Cloud sync**: lists and items are stored in Supabase (Postgres) and sync in real time
  across every device you're signed into.
- **Themes**: tap the palette icon on a list to give it a Keep-style pastel color or a photo
  background, synced across devices.
- **Custom icons**: Travel and Grocery lists have fixed icons; Custom lists let you pick one
  from an icon grid, at creation or later via the palette icon.
- **Rename anytime**: tap the list name in its header to rename it (and change its icon, for
  Custom lists).
- **Archive**: swipe a list left on the Lists screen to archive it. The archive icon in the
  header opens the Archive screen, where you can restore a list or delete it permanently.

> **Add-by-voice is temporarily removed.** It used `expo-speech-recognition`, a native module
> not bundled in Expo Go — having it installed made Expo Go refuse to open the project at all
> (it prompts to sign in and create a development build instead). It's been pulled out so the
> app runs in plain Expo Go for now. To bring it back: restore `src/components/voice-input-button.tsx`
> from git history (`git log --all --full-name -- '*voice-input-button*'`), re-add the
> `expo-speech-recognition` plugin block to `app.json`, run `npm install expo-speech-recognition`,
> and build a custom dev client (`npx expo run:ios` / `run:android`, or `eas build --profile development`)
> instead of using plain Expo Go.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account/project.
2. In your project, open **SQL Editor** → **New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the `lists` and
   `list_items` tables, row-level security policies (so each user only sees their own data),
   and enables realtime sync.
3. Run a second query with the contents of
   [`supabase/002_list_themes.sql`](./supabase/002_list_themes.sql) — this adds the list
   background color/photo columns and a storage bucket for background photos.
4. Run a third query with the contents of
   [`supabase/003_list_icons.sql`](./supabase/003_list_icons.sql) — this adds the custom icon
   column for Custom lists.
5. Run a fourth query with the contents of
   [`supabase/004_list_archive.sql`](./supabase/004_list_archive.sql) — this adds archive
   (soft-delete) support.
6. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values from step 1:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`.env` is git-ignored — never commit real keys.

## 3. Install and run

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for an Android emulator, or scan the QR code with
[Expo Go](https://expo.dev/go) on your phone.

## Project structure

```
src/
  app/                 expo-router screens (file-based routing)
    _layout.tsx        root layout, auth gate
    sign-in.tsx         sign in / sign up screen
    (tabs)/            main app tabs (Lists, Settings)
    list/[id].tsx        list detail: items, checkboxes, text add
  components/          shared UI (themed text/view, theme picker sheet)
  hooks/               use-auth, use-lists, use-list-items (Supabase queries + realtime)
  lib/supabase.ts      Supabase client
  types.ts             shared TypeScript types
supabase/schema.sql    database schema + RLS policies to run in Supabase
```

## Syncing this repo across machines (e.g. Windows + Mac)

```bash
git pull            # before you start working
# ...edit...
git add -A
git commit -m "..."
git push            # after you're done, so the other machine can pull it
```
