# task_manager

Expo (React Native) task and reminder app with **Supabase** (auth, tasks CRUD, images, local due-time notifications).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` and set:

   - `EXPO_PUBLIC_SUPABASE_URL` — Project URL (Supabase → Settings → API)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Publishable (anon) key

3. **Database** — in Supabase SQL Editor, run `supabase/schema.sql`.

4. **Run the app**

   ```bash
   npx expo start
   ```

## Stack

- Expo Router, TypeScript, `expo-notifications`, `expo-image-picker`, `@supabase/supabase-js`

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Supabase docs](https://supabase.com/docs)
