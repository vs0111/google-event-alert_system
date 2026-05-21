import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

import {
  getCalendarClient,
  getOAuthClient,
} from "@/lib/google";

import client from "@/lib/twilio";

export async function GET() {
  try {
    await connectDB();

    const users = await User.find();

    for (const user of users) {
      if (!user.phone) continue;

      // Create OAuth Client
      const oauth2Client = getOAuthClient(
        user.accessToken,
        user.refreshToken
      );

      // Refresh expired access token
      const refreshedToken =
        await oauth2Client.refreshAccessToken();

      const newAccessToken =
        refreshedToken.credentials.access_token;

      // Save new token
      user.accessToken = newAccessToken;

      await user.save();

      // Create calendar client
      const calendar =
        getCalendarClient(oauth2Client);

      const now = new Date();

      const nextFiveMinutes = new Date(
        now.getTime() + 5 * 60 * 1000
      );

      const events = await calendar.events.list({
        calendarId: "primary",

        timeMin: now.toISOString(),

        timeMax: nextFiveMinutes.toISOString(),

        singleEvents: true,

        orderBy: "startTime",
      });

      const upcomingEvents =
        events.data.items || [];

      for (const event of upcomingEvents) {
        if (!event.id) continue;

        // Prevent duplicate reminders
        if (
          user.remindedEvents &&
          user.remindedEvents.includes(event.id)
        ) {
          continue;
        }

        // Make Twilio Call
        await client.calls.create({
          to: user.phone,

          from:
            process.env.TWILIO_PHONE_NUMBER!,

          twiml: `
            <Response>
              <Say voice="alice">
                Hello ${user.name}.
                You have an upcoming event.
                ${event.summary || "Meeting"}
                starts soon.
              </Say>
            </Response>
          `,
        });

        // Save reminded event
        user.remindedEvents.push(event.id);

        await user.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron executed",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      success: false,
      message: "Cron failed",
    });
  }
}