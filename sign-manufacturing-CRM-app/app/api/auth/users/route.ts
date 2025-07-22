import { NextRequest, NextResponse } from "next/server"
import { authDB } from "@/lib/auth-db"
import jwt, { JwtPayload } from "jsonwebtoken"
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false
  try {
    const token = authHeader.split(" ")[1]
    const user = jwt.verify(token, JWT_SECRET) as JwtPayload
    return typeof user === 'object' && user.role === "admin"
  } catch {
    return false
  }
}

// List all pending users (GET /pending)
export async function GET(request: NextRequest) {
  try {
    const users = await authDB.listUsers()
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// Accept user (POST /accept)
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function DELETE(request: NextRequest) {
  try {
    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 })
    }
    // Prevent deleting admin or self (should be checked on frontend too)
    if (username === "admin") {
      return NextResponse.json({ error: "Cannot delete admin user" }, { status: 403 })
    }
    const success = await authDB.deleteUser(username)
    if (!success) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
} 