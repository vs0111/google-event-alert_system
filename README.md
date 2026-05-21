# Google Calendar & Twilio Call Alerts

Hey! Welcome to the repository. This project is a Next.js 15 app designed to automatically call your phone 5 minutes before any Google Calendar meeting starts. It uses NextAuth for Google logins, MongoDB to store user configurations, and Twilio to trigger the voice calls.

Here is a quick, human-friendly guide to get this running on your local machine and deploy it for free.

---

##  How to Set it Up Locally

### 1. Grab the Dependencies
First, make sure you've got Node.js installed (v18+ works perfectly). Go ahead and install everything:
```bash
npm install
```

### 2. Set Up Your Environment Variables (`.env.local`)
Create a file named `.env.local` in the root of the project. Here's the template you need to fill out:

```env
# Google OAuth (Register a project in Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# NextAuth (Authentication setup)
NEXTAUTH_SECRET="something_long_and_random"
NEXTAUTH_URL="http://localhost:3000"

# MongoDB (Mongoose connection string)
MONGODB_URI="your_mongodb_connection_string"

# Twilio (For initiating the calls)
TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="your_twilio_phone_number"
```

> [!TIP]
> **Quick Tips for getting keys:**
> * **Google Cloud Console:** Create a new project, enable the **Google Calendar API**, configure the OAuth Consent Screen (add your email as a test user), and create "Web Application" client credentials. Set the redirect URI to `http://localhost:3000/api/auth/callback/google`.
> * **MongoDB Atlas:** Set up a free shared cluster (M0) and copy the connection string. Make sure to whitelist IP `0.0.0.0/0` under Network Access so Vercel can connect later.
> * **Twilio Trial:** Grab a free Twilio phone number. *Important Note:* Since it's a trial account, you have to verify your personal phone number under "Verified Caller IDs" in Twilio first, or the app won't be allowed to call you.

### 3. Spin Up the Dev Server
Start the local server with:
```bash
npm run dev
```
Open up [http://localhost:3000](http://localhost:3000) in your browser. You should see the sleek dashboard!

---

##  How to Test It

### 1. Test Login & Phone Call
1. Click **Continue with Google** to authorize your calendar.
2. Type in your phone number (make sure it's the same one you verified in your Twilio console if you are using a Twilio trial account).
3. Save it.
4. Click the **Trigger instant test call** button. Within a few seconds, your phone should ring and play the voice message!

### 2. Testing the Cron Job
The system checks for upcoming meetings using a serverless cron job route: `/api/cron`. In production, this runs automatically. Locally, you can trigger it manually to test the flow:
1. Open your Google Calendar and create an event starting **exactly 5 minutes from now**.
2. Make a `GET` request to `http://localhost:3000/api/cron` (you can just open this URL in your web browser).
3. The server will scan the database, query Google Calendar for your event, and dial your phone to read the meeting title.
4. It also saves the event ID in MongoDB so it won't call you twice for the same event.

---

##  Free Hosting Instructions

### Frontend/Backend: Vercel (Hobby Tier)
1. Push your code to a GitHub repository.
2. Import the project to Vercel.
3. Paste all variables from your `.env.local` into Vercel's Environment Variables section (but change `NEXTAUTH_URL` to your production vercel domain).
4. Vercel reads the `vercel.json` file in this repository and automatically schedules the cron jobs for you on deploy!

### Database: MongoDB Atlas (M0 Free Tier)
* Host your database with the free shared instance (512MB limit, which is plenty).

### Calls: Twilio Free Trial
* Use the free signup credits (~$15.00) to test and run your notifications. Remember to keep target phone numbers verified!
