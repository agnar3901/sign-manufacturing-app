import { NextRequest, NextResponse } from "next/server"
import { authDB } from "@/lib/auth-db"

export async function POST(request: NextRequest) {
  try {
    await authDB.createDefaultAdmin()
    
    return NextResponse.json({
      message: "Admin user initialized successfully",
      credentials: {
        username: "admin",
        password: "admin123"
      }
    })
  } catch (error) {
    console.error("Init error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 