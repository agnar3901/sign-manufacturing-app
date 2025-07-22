import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import nodemailer from "nodemailer"
import fs from "fs"

// In-memory storage for demo (replace with actual database)
const orders: any[] = [
  {
    id: "1",
    invoiceId: "INV_001",
    customerName: "John Doe",
    phoneNumber: "+91-9876543210",
    emailAddress: "john@example.com",
    itemType: "flex",
    size: "4x6 feet",
    quantity: 2,
    rate: 150,
    total: 300,
    deliveryType: "pickup",
    paymentMode: "cash",
    status: "completed",
    createdAt: "2024-01-15T10:30:00Z",
    notes: "Rush order for event",
  },
  {
    id: "2",
    invoiceId: "INV_002",
    customerName: "Jane Smith",
    phoneNumber: "+91-9876543211",
    emailAddress: "jane@example.com",
    itemType: "acrylic",
    size: "12x18 inches",
    quantity: 1,
    rate: 500,
    total: 500,
    deliveryType: "delivery",
    paymentMode: "upi",
    status: "processing",
    createdAt: "2024-01-16T14:20:00Z",
  },
]

// SMTP configuration using environment variables
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
})

// Validate SMTP configuration
const isSmtpConfigured = () => {
  return process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const limit = url.searchParams.get("limit")
  const date = url.searchParams.get("date")
  if (url.pathname.endsWith("/recent") || limit) {
    // Fetch recent N orders
    const result = await callPythonScript({ mode: "recent", limit: limit ? parseInt(limit) : 20 })
    if (result.success) {
      return NextResponse.json(result.orders)
    } else {
      return NextResponse.json({ error: result.error || "Failed to fetch orders" }, { status: 500 })
    }
  } else if (url.pathname.endsWith("/by-date") || date) {
    // Fetch orders by date
    const result = await callPythonScript({ mode: "by-date", date })
    if (result.success) {
      return NextResponse.json(result.orders)
    } else {
      return NextResponse.json({ error: result.error || "Failed to fetch orders" }, { status: 500 })
    }
  } else {
    // Default: all orders (legacy)
    const result = await callPythonScript({ mode: "all" })
    if (result.success) {
      return NextResponse.json(result.orders)
    } else {
      return NextResponse.json({ error: result.error || "Failed to fetch orders" }, { status: 500 })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Calculate total
    const total = data.quantity * data.rate

    // Prepare order data for Python script
    const orderData = {
      customer_name: data.customerName,
      phone_number: data.phoneNumber,
      email_address: data.emailAddress,
      item_type: data.itemType,
      size: data.size,
      quantity: data.quantity,
      rate: data.rate,
      total: total,
      delivery_type: data.deliveryType,
      payment_mode: data.paymentMode,
      notes: data.notes || "",
      material: data.material || null,
      lamination: typeof data.lamination !== 'undefined' ? data.lamination : null,
      discount: typeof data.discount !== 'undefined' ? data.discount : null,
    }

    // Call Python script to process the order
    const result = await callPythonScript(orderData)
    let emailSent = false
    if (result.success) {
      // Add to orders array for demo (in production, this would come from database)
      const order = {
        id: Date.now().toString(),
        invoiceId: result.invoice_id,
        ...data,
        total,
        status: "pending",
        createdAt: new Date().toISOString(),
      }
      orders.unshift(order)

      // Send invoice PDF to customer email
      try {
        if (!isSmtpConfigured()) {
          console.warn("SMTP not configured - skipping email sending")
          emailSent = false
        } else if (!data.emailAddress) {
          console.warn("No email address provided - skipping email sending")
          emailSent = false
        } else if (!result.pdf_path || !fs.existsSync(result.pdf_path)) {
          console.warn(`PDF file not found at path: ${result.pdf_path}`)
          emailSent = false
        } else {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(data.emailAddress)) {
            console.warn(`Invalid email format: ${data.emailAddress}`)
            emailSent = false
          } else {
            console.log(`Attempting to send email to: ${data.emailAddress}`)
            console.log(`PDF path: ${result.pdf_path}`)
            
            await smtpTransport.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER || 'orders@rangaadigitals.com',
              to: data.emailAddress,
              subject: `Your Invoice from Rangaa Digitals - ${result.invoice_id}`,
              text: `Dear ${data.customerName},\n\nThank you for your order! Please find your invoice attached.\n\nOrder Details:\n- Invoice ID: ${result.invoice_id}\n- Item: ${data.itemType}\n- Size: ${data.size}\n- Quantity: ${data.quantity}\n- Total: ₹${total.toFixed(2)}\n\nBest regards,\nRangaa Digitals`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Thank you for your order!</h2>
                  <p>Dear ${data.customerName},</p>
                  <p>Your order has been successfully processed. Please find your invoice attached.</p>
                  
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Details:</h3>
                    <p><strong>Invoice ID:</strong> ${result.invoice_id}</p>
                    <p><strong>Item:</strong> ${data.itemType}</p>
                    <p><strong>Size:</strong> ${data.size}</p>
                    <p><strong>Quantity:</strong> ${data.quantity}</p>
                    <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
                  </div>
                  
                  <p>If you have any questions, please don't hesitate to contact us.</p>
                  <p>Best regards,<br>Rangaa Digitals</p>
                </div>
              `,
              attachments: [
                {
                  filename: `${result.invoice_id}.pdf`,
                  path: result.pdf_path,
                  contentType: 'application/pdf',
                },
              ],
            })
            
            console.log(`Email sent successfully to: ${data.emailAddress}`)
            emailSent = true
          }
        }
      } catch (err) {
        console.error("Failed to send invoice email:", err)
        console.error("Email error details:", {
          to: data.emailAddress,
          pdfPath: result.pdf_path,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        })
        emailSent = false
      }

      return NextResponse.json({
        success: true,
        invoiceId: result.invoice_id,
        pdfPath: result.pdf_path,
        notifications: result.notifications,
        message: "Order created successfully and invoice sent to customer",
        emailSent,
      })
    } else {
      throw new Error(result.error || "Failed to process order")
    }
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

async function callPythonScript(orderData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "process_order.py")
    const orderDataJson = JSON.stringify(orderData)
    
    const pythonProcess = spawn("python", [scriptPath, orderDataJson], {
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


