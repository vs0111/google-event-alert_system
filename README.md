# Google Calendar Twilio Caller Alert System

This is a premium, responsive **Next.js 15 (App Router)** application that integrates **Google OAuth**, **Google Calendar**, **MongoDB**, and **Twilio Voice API** to automatically trigger phone call alerts for upcoming calendar events 5 minutes before they begin.

---

## 🚀 Key Features

* **Google OAuth Integration**: Users log in securely with their Google accounts, allowing the app to read calendar events.
* **Premium Glassmorphism UI**: High-fidelity dark mode interface with smooth animations, dynamic blur overlays, and fully responsive layouts.
* **Strict Phone Validation**: Restricts input to exactly 10 digits, and includes a flexible country code selector.
* **Instant Twilio Test Call**: Includes a diagnostic testing panel that allows users to trigger a phone call instantly to confirm credentials work.
* **Alert Timeline Monitor**: 
  * Displays upcoming scheduled events and called history items.
  * Lists scroll independently and are constrained to show exactly 2 items maximum, ensuring a clean dashboard layout.
* **Signout Confirmation Modal**: Displays an elegant confirmation prompt before ending the user session.
* **Background Cron Service**: Includes a serverless cron route (`/api/cron`) that runs on a schedule to fetch calendars, compute offsets, call users, and flag called events in the database to prevent duplicate alerts.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript
* **Database**: MongoDB (via Mongoose ORM)
* **Auth**: NextAuth.js (Google Provider with offline access scopes)
* **Communications**: Twilio SDK (Voice Calls)
* **Styling**: Tailwind CSS & Vanilla CSS Transitions

---

## 🔑 Environment Setup (`.env.local`)

To run this application locally, create a `.env.local` file in the root directory and add the following keys:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# MongoDB Database Connection
MONGODB_URI="your-mongodb-connection-string"

# Twilio Communication Credentials
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-assigned-phone-number"
```

---

## ⚙️ Installation & Running

### 1. Install Dependencies
Make sure you have Node.js (v18+) installed. Run the following command in the project directory:
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Verify Build for Production
To test the production compilation, run:
```bash
npm run build
```

---

## 🧪 Testing and API Workflows

### Standard User Flow
1. Open the homepage at `http://localhost:3000` and click **Continue with Google** to authorize calendar read access.
2. Select your country code and enter your **10-digit phone number**.
3. Click **Save phone number**.
4. Click **📞 Trigger instant test call** to verify that your Twilio settings are configured correctly and receive a voice call instantly.

### Simulating the Background Cron Call
In production, a scheduler triggers the serverless cron endpoint periodically. To manually trigger the scheduler check in development:
1. Make a `GET` request to:
   ```
   http://localhost:3000/api/cron
   ```
2. The cron system will:
   * Fetch users from MongoDB.
   * Fetch their Google Calendar events for the next 7 days.
   * Locate any meetings starting **exactly 5 minutes from now** (with a 1-minute buffer window).
   * Call the saved phone number via Twilio, reading out the meeting details.
   * Mark the event ID in MongoDB (`remindedEvents`) so the user isn't called again.
