import { NextRequest, NextResponse } from "next/server"
import { getMemoryUsage } from "@/lib/memory-monitor"

export async function GET(request: NextRequest) {
  try {
    const memoryUsage = getMemoryUsage()
    
    return NextResponse.json({
      success: true,
      data: memoryUsage,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error getting memory usage:", error)
    return NextResponse.json(
      { success: false, error: "Failed to get memory usage" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'log') {
      const { logMemoryUsage } = await import("@/lib/memory-monitor")
      logMemoryUsage()
      return NextResponse.json({ success: true, message: "Memory usage logged" })
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error in memory API:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
} 