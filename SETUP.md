# Setup Guide for Reminiscent Streaming

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Discord application (for authentication)
- A TMDB API key (for movie/TV show data)
- A database (PostgreSQL, MySQL, or SQLite)

## 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your_database_connection_string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

# Discord OAuth (for user authentication)
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# TMDB API (for movie/TV show data)
TMDB_API_KEY="your_tmdb_api_key"
```

### Getting the required keys:

#### Discord OAuth Setup:
1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to OAuth2 → General
4. Copy the Client ID and Client Secret
5. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`

#### TMDB API Key:
1. Go to https://www.themoviedb.org/settings/api
2. Create an account and request an API key
3. Copy the API key

#### NextAuth Secret:
Run this command to generate a secure secret:
```bash
npm run gen:secret
```

#### Database Setup:
- **For PostgreSQL**: `postgresql://username:password@localhost:5432/database_name`
- **For MySQL**: `mysql://username:password@localhost:3306/database_name`
- **For SQLite**: `file:./dev.db`

## 2. Install Dependencies

```bash
npm install
```

## 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push
```

## 4. Run the Development Server

```bash
npm run dev
```

## 5. Access the Application

Open your browser and go to `http://localhost:3000`

## Troubleshooting

### Content Not Loading
- Make sure you have a valid TMDB_API_KEY
- Check the browser console for API errors
- Verify the database connection

### Authentication Issues
- Ensure Discord OAuth is properly configured
- Check that NEXTAUTH_SECRET is set
- Verify Discord redirect URI matches exactly

### Database Issues
- Make sure DATABASE_URL is correct
- Run `npx prisma db push` to sync the schema
- Check if the database server is running

### 401 Unauthorized Errors
- This is normal for unauthenticated users
- Sign in with Discord to access all features
- The presence heartbeat only works for authenticated users

## Features That Require Authentication
- User profiles
- Watch history
- Ratings and comments
- Admin panel
- Member statistics

## Features That Work Without Authentication
- Browsing movies and TV shows
- Search functionality
- Viewing content details
- Basic navigation
