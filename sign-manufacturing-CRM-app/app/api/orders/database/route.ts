import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Simple in-memory rate limiter
const rateLimitWindowMs = 10 * 60 * 1000 // 10 minutes
const rateLimitMax = 60 // max requests per window
const rateLimitMap = new Map<string, { count: number, start: number }>()

export async function GET(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const now = Date.now()
  const entry = rateLimitMap.get(ip) || { count: 0, start: now }
  if (now - entry.start > rateLimitWindowMs) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, start: now })
  } else {
    if (entry.count >= rateLimitMax) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }
    rateLimitMap.set(ip, { count: entry.count + 1, start: entry.start })
  }
  try {
    // JWT authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const token = authHeader.split(" ")[1]
    let user
    try {
      user = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "15", 10)
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined
    const date = searchParams.get("date") || undefined

    let result
    if (date) {
      result = await callPythonScript({ mode: "by-date", date, page, limit })
    } else {
      result = await callPythonScript({ page, limit, search, status })
    }
    
    if (result.success) {
      return NextResponse.json({ orders: result.orders, total: result.total })
    } else {
      throw new Error(result.error || "Failed to fetch orders")
    }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

async function callPythonScript(args: { page?: number, limit?: number, search?: string, status?: string, mode?: string, date?: string }): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "get_orders.py")
    const argStr = JSON.stringify(args)
    const pythonProcess = spawn("python", [scriptPath, argStr], {
      cwd: process.cwd(),
    })

    let stdout = ""
    let stderr = ""

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`))
      }
    })

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`))
    })
  })
} 