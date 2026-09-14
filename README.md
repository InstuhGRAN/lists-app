# Lists

A cross-platform (iOS + Android) checklist app built with Expo / React Native. Built for
travel checklists and grocery lists, with cloud sync across devices and add-by-voice.

- **Cross-platform**: one codebase, runs on iOS, Android, and web (via Expo).
- **Cloud sync**: lists and items are stored in Supabase (Postgres) and sync in real time
  across every device you're signed into.
- **Add by voice**: tap the mic on a list to speak an item instead of typing it, using the
  device's built-in speech recognition (no API key, works offline on most devices).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account/project.
2. In your project, open **SQL Editor** → **New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the `lists` and
   `list_items` tables, row-level security policies (so each user only sees their own data),
   and enables realtime sync.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

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

> Voice input requires a native build (a real device or simulator/emulator with the
> `expo-speech-recognition` native module) — it does not work in Expo Go on Android, and has
> limited support in Expo Go on iOS. For full testing, use `npx expo run:ios` /
> `npx expo run:android`, or an EAS development build.

## Project structure

```
src/
  app/                 expo-router screens (file-based routing)
    _layout.tsx        root layout, auth gate
    sign-in.tsx         sign in / sign up screen
    (tabs)/            main app tabs (Lists, Settings)
    list/[id].tsx        list detail: items, checkboxes, voice + text add
  components/          shared UI (themed text/view, voice input button)
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
