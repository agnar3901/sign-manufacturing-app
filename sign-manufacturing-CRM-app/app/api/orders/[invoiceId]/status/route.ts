import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function PATCH(request: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const { invoiceId } = params
    const { status } = await request.json()
    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 })
    }
    const result = await callPythonScript(invoiceId, status)
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      throw new Error(result.error || "Failed to update status")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    // Check admin JWT
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.replace(/^Bearer /i, "")
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 })
    let user: any
    try {
      user = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { invoiceId } = params
    const result = await callDeleteOrderScript(invoiceId)
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      throw new Error(result.error || "Failed to delete order")
    }
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}

async function callPythonScript(invoiceId: string, status: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "update_order_status.py")
    const pythonProcess = spawn("python", [scriptPath, invoiceId, status], {
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

async function callDeleteOrderScript(invoiceId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "delete_order.py")
    const pythonProcess = spawn("python", [scriptPath, invoiceId], {
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