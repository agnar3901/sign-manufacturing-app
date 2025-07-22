import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { authDB } from "@/lib/auth-db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    const { username, password, fullName, role } = await request.json()

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { error: "Username, password, and full name are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Create new user as active
    const newUser = await authDB.createUser(username, password, fullName, role || "user", "active")

    return NextResponse.json({
      user: newUser,
      message: "Signup successful."
    })

  } catch (error: any) {
    console.error("Signup error:", error)
    
    if (error.message === "Username already exists") {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 