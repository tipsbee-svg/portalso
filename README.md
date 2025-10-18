
# Staff Officer Portal

This is a production-ready Single Page Application called **Staff Officer Portal** (React + TypeScript + Vite + Tailwind) with a Supabase backend (Auth, Postgres, Realtime) and Firebase Hosting.

The application is designed to be deployable with `npm run build` and `firebase deploy` from Google Cloud Shell, and to be usable within the free tiers of Supabase and Firebase.

**IMPORTANT**: This application uses the Supabase **anon** key on the frontend. This key is client-safe and designed for public use, as Row Level Security (RLS) is enforced in the database to protect data. **Never** commit or expose your `service_role` key in any client-side code.

---

## Build & Deploy Guide

### 1. Prerequisites

*   Node 18+ (In Cloud Shell, you can use `nvm install 18 && nvm use 18`)
*   A Google Account with an active Firebase project.
*   A Supabase account with an active project.
*   Firebase CLI (`curl -sL https://firebase.tools | bash` to install in Cloud Shell)

### 2. Supabase Setup

1.  **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Run SQL Schema**: Navigate to the **SQL Editor** in your Supabase project dashboard. Copy the entire content of `sql/schema.sql` from this repository and run it. This will create all the necessary tables, roles, and policies.
3.  **Get API Keys**: Go to **Project Settings > API**. You will find your Project `URL` and the `anon` public key.
4.  **Configure Auth**: Go to **Authentication > Providers** and ensure `Email` is enabled. You can also disable "Confirm email" for easier testing, but it's recommended to keep it on for production.

### 3. Project Setup (Local or Google Cloud Shell)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd staff-officer-portal

# 2. Install Node.js v18 (if not present)
nvm install 18
nvm use 18

# 3. Create your environment file
cp .env.example .env

# 4. Edit the .env file with your actual Supabase and Firebase credentials
#    Use a text editor like nano or vim to set:
#    VITE_SUPABASE_URL=<Your Supabase Project URL>
#    VITE_SUPABASE_ANON_KEY=<Your Supabase anon public key>
#    VITE_FIREBASE_PROJECT=<Your Firebase Project ID>

nano .env

# 5. Install dependencies
npm ci

# 6. Build the application for production
npm run build
```

### 4. Firebase Hosting Init & Deploy

```bash
# 1. Log in to Firebase (a browser window will open for authentication)
#    Use --no-localhost if you're in a restricted environment like Cloud Shell
firebase login --no-localhost

# 2. Initialize Firebase Hosting in your project
#    If a .firebaserc file is already present, this may not be needed. If it is, run:
firebase init hosting

#    During initialization:
#    - Choose "Use an existing project" and select your Firebase project.
#    - What do you want to use as your public directory? -> dist
#    - Configure as a single-page app (rewrite all urls to /index.html)? -> Yes
#    - File dist/index.html already exists. Overwrite? -> No

# 3. Deploy to Firebase Hosting
#    Use the project ID from your .env file to ensure you deploy to the correct project.
firebase deploy --only hosting --project $VITE_FIREBASE_PROJECT
```

### 5. Create Super Admin & Verify

After deployment, you need a `super_admin` to approve new users.

1.  **Register a User**: Open your deployed application URL and register a new user. This will be your admin account.
2.  **Promote to Super Admin**:
    *   Go to your Supabase project dashboard.
    *   Navigate to **Table Editor > profiles**.
    *   Find the row for the user you just created.
    *   Change the `role` column to `super_admin`.
    *   Set the `approved` column to `true`.
3.  **Verification Checklist**:
    *   [ ] Open the hosted URL in an incognito window.
    *   [ ] Register a new, non-admin user. Confirm you see the "pending approval" message.
    *   [ ] In the Supabase `profiles` table, confirm a new row was created with `approved=false`.
    *   [ ] Log in as the `super_admin` user.
    *   [ ] Navigate to the "Admin" page and approve the new user.
    *   [ ] Log out, then log in as the newly approved user.
    *   [ ] Verify you can access the dashboard, directory, and chat features.

---

## Budgeting & Free-tier Recommendations

*   **Supabase Free Tier**: The free plan is generous but has limits. To stay within them, avoid creating a large number of real-time subscriptions and be mindful of database size. For long-term use, consider setting up a cron job (e.g., using a Supabase Edge Function) to periodically prune old messages from the `messages` table (e.g., keep only the last 5,000 messages or messages from the last 90 days).
*   **Firebase Free Tier**: The hosting free tier is very generous for traffic and storage. Since this app does not use file uploads, it is unlikely to exceed these limits with a small to medium user base.
*   If your user base grows beyond a few hundred active users, you should consider upgrading to a paid plan on Supabase to ensure performance and avoid hitting free-tier limits.
