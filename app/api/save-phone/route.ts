import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { email, phone } = body;

    await User.findOneAndUpdate(
      {
        email,
      },

      {
        phone,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Phone number saved",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      success: false,
      message: "Something went wrong",
    });
  }
}