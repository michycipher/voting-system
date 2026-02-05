# Secure Voting System

A comprehensive, real-time voting web application built with React, TypeScript, and Convex. Designed to handle up to 3,000 concurrent voters with live results, audit logging, and complete admin control.

## Features

### Voter Features
- **Secure Login**: Unique 8-character codes for each voter
- **Simple Interface**: Clean, intuitive voting experience
- **Position-based Voting**: Vote for multiple positions in one session
- **Vote Confirmation**: Clear confirmation after successful vote submission
- **Mobile Responsive**: Works seamlessly on all device sizes

### Admin Features
- **Dashboard**: Real-time statistics and visualizations
- **Candidate Management**: Add, edit, and remove candidates with photos and biographies
- **Voter Management**: 
  - Add voters individually or in bulk via CSV
  - Generate unique voting codes automatically
  - Export voter lists with codes
- **Live Results**: Real-time vote counting with charts and rankings
- **Audit Logs**: Complete activity history with export functionality
- **Settings**: Control voting status and configure election parameters

## Tech Stack

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe development
- **TanStack Query**: Efficient data fetching (via Convex hooks)
- **React Hook Form**: Performant form handling
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **React Hot Toast**: Beautiful notifications

### Backend & Database
- **Convex**: Real-time database with automatic scaling
  - Handles 3000+ concurrent users
  - Real-time subscriptions for live updates
  - Built-in security and authentication
  - Automatic conflict resolution

### Architecture
- **Feature-based Organization**: Scalable folder structure
- Separation of concerns (voter vs admin features)
- Reusable components and utilities
- Type-safe API calls with generated types

## Project Structure

```
voting-app/
├── convex/                    # Backend functions and schema
│   ├── schema.ts             # Database schema
│   ├── candidates.ts         # Candidate CRUD operations
│   ├── voters.ts             # Voter management
│   ├── votes.ts              # Voting logic
│   ├── settings.ts           # System settings
│   └── auditLogs.ts          # Audit trail
├── src/
│   ├── features/             # Feature-based modules
│   │   ├── voter/           # Voter-facing features
│   │   │   ├── pages/       # Voter pages
│   │   │   └── layouts/     # Voter layout
│   │   └── admin/           # Admin features
│   │       ├── pages/       # Admin pages
│   │       ├── layouts/     # Admin layout
│   │       ├── components/  # Admin components
│   │       └── contexts/    # Auth context
│   ├── types/               # TypeScript definitions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A Convex account

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Convex

1. Create a Convex account at https://www.convex.dev/
2. Install Convex CLI globally:
```bash
npm install -g convex
```

3. Initialize Convex in your project:
```bash
npx convex dev
```

This will:
- Create a new Convex project
- Generate your deployment URL
- Start the Convex development server

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_CONVEX_URL=https://your-deployment-url.convex.cloud
VITE_ADMIN_USERNAME=adminName
VITE_ADMIN_PASSWORD=123!
```

Replace `your-deployment-url` with the URL provided by Convex.

### Step 4: Start Development Server

In a new terminal (keep Convex dev running):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Step 5: Access the Application

- **Voter Interface**: `http://localhost:5173`
- **Admin Login**: `http://localhost:5173/admin/login`

Default admin credentials:
- Username: `admin`
- Password: `YourSecurePassword123!` (or what you set in .env)

## Usage Guide

### Admin Workflow

1. **Login**: Access `/admin/login` with admin credentials

2. **Add Candidates**:
   - Go to "Candidates" page
   - Click "Add Candidate"
   - Fill in candidate details (title, name, position, photo URL, biography)
   - Candidates can be organized by position

3. **Add Voters**:
   - Go to "Voters" page
   - **Single Voter**: Click "Add Voter" and fill the form
   - **Bulk Upload**: 
     - Click "Template" to download CSV template
     - Fill the CSV with voter data
     - Click "Import CSV" to upload
   - Unique codes are generated automatically

4. **Enable Voting**:
   - Go to "Settings" page
   - Ensure candidates and voters are added
   - Click "Enable Voting"

5. **Monitor Results**:
   - Visit "Live Results" for real-time vote counts
   - View "Dashboard" for overall statistics
   - Check "Audit Logs" for complete activity history

6. **Export Data**:
   - Export voter list with codes from "Voters" page
   - Export audit logs from "Audit Logs" page

### Voter Workflow

1. **Login**: Enter unique 8-character code on homepage
2. **Vote**: Select one candidate per position
3. **Review**: Check selections before submitting
4. **Confirm**: Submit all votes at once
5. **Done**: View confirmation page

## CSV Import Format

For bulk voter upload, use this CSV format:

```csv
title,firstName,middleName,surname,gender
Mr,John,James,Doe,Male
Mrs,Jane,Marie,Smith,Female
Dr,Michael,Peter,Johnson,Male
```

- `title`: Mr, Mrs, Ms, Dr, Prof
- `firstName`: Required
- `middleName`: Optional (can be empty)
- `surname`: Required
- `gender`: Male, Female, Other

## Database Schema

### Candidates
- Title, First Name, Middle Name (optional), Surname
- Position (e.g., President, Vice President)
- Image URL (optional)
- Biography (optional)
- Vote count (auto-incremented)

### Voters
- Unique 8-character code (auto-generated)
- Title, First Name, Middle Name (optional), Surname
- Gender
- Voting status (hasVoted: boolean)
- Timestamp of vote

### Votes (Audit Trail)
- Voter code
- Candidate ID and name
- Position
- Timestamp
- Voter name (for audit purposes)

### Audit Logs
- Action type
- Performed by
- Details
- Timestamp
- Category (voter, candidate, vote, system)

## Security Features

- **Vote Privacy**: Individual votes cannot be traced to specific voters in the UI
- **One Vote Per Code**: Each unique code can only vote once
- **Audit Trail**: All actions are logged with timestamps
- **Admin Authentication**: Password-protected admin access
- **Real-time Validation**: Prevents duplicate votes and invalid actions

## Performance Optimization

- **Real-time Updates**: Convex provides instant synchronization
- **Efficient Queries**: Indexed database queries for fast access
- **Optimistic UI**: Immediate feedback on user actions
- **Pagination**: Large datasets handled efficiently
- **Responsive Design**: Optimized for all screen sizes

### Election Title
Change via Settings page in admin dashboard.

### Maximum Candidates
Adjust via Settings page (default: 20 per position, max: 50).

## License

MIT License - feel free to use for your elections!

## Version

1.0.0 - Initial Release