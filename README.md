# Andcord - Social Media App

A modern, minimalistic social media application built with Next.js 14 and Supabase.

![Andcord](https://via.placeholder.com/800x400?text=Andcord+Social+App)

## Features

- 🔐 **Authentication** - Email/password login and registration
- 📰 **Feed** - Post text, images, and videos with infinite scroll
- 💬 **Direct Messages** - Real-time chat with friends
- 👥 **Groups** - Create and chat in group conversations
- 🤝 **Friends** - Send/accept friend requests, search users
- 👤 **Profiles** - Avatar upload, bio editing
- 🔔 **Notifications** - Real-time notification system
- ✨ **Smooth Animations** - Premium, modern UI with dark mode

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage
- **Styling**: Vanilla CSS with CSS Variables
- **Deployment**: Vercel

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SetFodi/Andcord.git
cd Andcord
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** to find your project URL and anon key
3. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set up the database

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create all tables, indexes, and RLS policies

### 5. Configure Storage

1. Go to **Storage** in your Supabase dashboard
2. Create two buckets:
   - `avatars` (set to public)
   - `posts` (set to public)

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository to [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
Andcord/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login/Register pages
│   ├── (main)/            # Protected pages (feed, messages, etc.)
│   └── globals.css        # Design system & global styles
├── components/            # React components
│   ├── feed/             # Post components
│   └── layout/           # Layout components
├── lib/                   # Utilities & hooks
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client config
│   └── utils/            # Helper functions
├── supabase/             # Database schema
└── types/                # TypeScript types
```

## License

MIT
