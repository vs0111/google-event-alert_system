import { NextResponse } from "next/server";
import client from "@/lib/twilio";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";

export async function POST() {
  try {
    await connectDB();

    // Get current user based on session or fallback to first user
    const session = await getServerSession();
    let user;
    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user || !user.phone) {
      return NextResponse.json({
        success: false,
        message: "Phone number not found. Please save a phone number first.",
      });
    }

    const call = await client.calls.create({
      to: user.phone,
      from: process.env.TWILIO_PHONE_NUMBER!,
      twiml: `
        <Response>
          <Say voice="alice">
            Hello! This is a test call from your Google Calendar Alert System. Your phone number is successfully verified and linked!
          </Say>
        </Response>
      `,
    });

    return NextResponse.json({
      success: true,
      sid: call.sid,
      message: "Test call triggered successfully! You should receive a call in a few seconds."
    });
  } catch (error) {
    const err = error as Error;
    console.error("Test call failed:", err);
    return NextResponse.json({
      success: false,
      message: err?.message || "Twilio call failed. Check your credentials in .env.local",
    });
  }
}