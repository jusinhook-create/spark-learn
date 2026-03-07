
# ALPHA THOUGHT — Ed-Tech Platform

## Design Direction
Clean & professional design (like Coursera/Udemy), white backgrounds, clear typography, accessible for all ages. Consistent card-based layout with subtle shadows and blue/purple accent colors.

## Phase 1: Foundation & Authentication
- **Google & Apple sign-in** via Lovable Cloud authentication
- **Email registration/login** with email verification
- **Profile setup** — display name, optional avatar upload, education level
- **Protected routes** — redirect unauthenticated users to login

## Phase 2: Home Screen & Navigation
- **Bottom navigation bar** (mobile-first): Home, AI Tutor, Quizzes, Classes, Profile
- **Home screen** with:
  - Motivational quote of the day
  - Topic of the day (featured lesson/content)
  - Quick-access cards to AI Tutor, Quizzes, Classes
  - Leaderboard preview (top 3 users)
- **Responsive sidebar navigation** for desktop

## Phase 3: AI Tutor
- **Chat interface** with the AI tutor powered by Lovable AI (Gemini)
- **Customizable AI avatar** selection (choose from preset teacher avatars)
- **Text input** for asking questions
- **Streaming responses** with structured explanations, examples, and resources
- **Conversation history** saved per user
- **Image upload** support for asking about diagrams/problems (camera/image input)

## Phase 4: Quiz & Gamification System
- **Quiz engine** — multiple choice questions with timer
- **Quiz creation tool** — users can create and publish their own quizzes
- **Coin system** — earn coins for completing quizzes, daily challenges, sharing
- **Group quizzes** — join quiz rooms with coin entry fees, top winners earn coins
- **Leaderboard** — global and weekly rankings by coins/score
- **Achievement badges** — milestones like "First Quiz", "10-Day Streak", "Quiz Master"
- **Daily challenges** — bonus rewards for completing daily tasks
- **Streak tracking** — consecutive days of activity

## Phase 5: Classes (UI Mockup)
- **Browse recorded classes** — categorized by subject/topic
- **Class detail page** — video player placeholder, description, related resources
- **Host a class form** — schedule, title, description, subject selection
- **Live class listing** — upcoming scheduled classes with join button (UI only, no actual video)
- **Class recording storage** — saved to user profile (UI representation)

## Phase 6: Profile & Progress Dashboard
- **Learning dashboard** — subjects studied, time spent, lessons completed
- **Performance analytics** — charts showing progress over time (using Recharts)
- **Coins & rewards display** — balance, transaction history
- **Badges & achievements gallery**
- **Streak counter** with calendar view
- **Study notes upload & management**
- **Referral system** — generate referral links, track signups

## Phase 7: Social & Community Features
- **Share achievements** — generate shareable cards (WhatsApp, Facebook, X, TikTok links)
- **Coin rewards for sharing** (3 coins per share, max 5/day)
- **Study Buddy system** — find and pair with learning partners
- **Community forums** — topic-based discussion threads
- **Note sharing** — publish and browse community study notes

## Phase 8: Content Creation Tools
- **Quiz builder** — create questions, set answers, publish to community
- **Study notes editor** — rich text editor for creating and sharing notes
- **Class hosting dashboard** — manage scheduled and recorded classes

## Backend (Lovable Cloud)
- User authentication & profiles
- Database for quizzes, coins, achievements, leaderboards, classes, notes, forums
- AI Tutor edge function using Lovable AI gateway
- File storage for avatars, notes, and class recordings
- Row-level security for all user data
