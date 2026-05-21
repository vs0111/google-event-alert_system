import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getCalendarClient, getOAuthClient } from "@/lib/google";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    await connectDB();

    // Try to get user by session, or fall back to the first user in DB
    const session = await getServerSession();
    let user;
    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        events: [],
        remindedEvents: [],
        phone: ""
      });
    }

    if (!user.accessToken || !user.refreshToken) {
      return NextResponse.json({
        success: false,
        message: "Google credentials missing. Please log in again.",
        events: [],
        remindedEvents: user.remindedEvents || [],
        phone: user.phone || ""
      });
    }

    // Create OAuth Client and refresh token
    const oauth2Client = getOAuthClient(
      user.accessToken,
      user.refreshToken
    );

    try {
      const refreshedToken = await oauth2Client.refreshAccessToken();
      const newAccessToken = refreshedToken.credentials.access_token;
      if (newAccessToken) {
        user.accessToken = newAccessToken;
        await user.save();
      }
    } catch (e) {
      console.log("Could not refresh token in events route, using existing token", e);
    }

    const calendar = getCalendarClient(oauth2Client);

    const now = new Date();
    // Fetch events from 24 hours ago to 7 days in future
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: oneDayAgo.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({
      success: true,
      events: eventsResponse.data.items || [],
      remindedEvents: user.remindedEvents || [],
      phone: user.phone || ""
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching calendar events:", err);
    return NextResponse.json({
      success: false,
      message: err?.message || "Something went wrong fetching events",
      events: [],
      remindedEvents: [],
      phone: ""
    });
  }
}