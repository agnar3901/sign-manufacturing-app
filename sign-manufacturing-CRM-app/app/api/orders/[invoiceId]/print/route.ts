import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function GET(request: NextRequest, { params }: { params: { invoiceId: string } }) {
  try {
    const { invoiceId } = await params

    // First, try to get order data to find the correct PDF path
    const orderDataResult = await getOrderData(invoiceId)
    const orderData = orderDataResult?.data
    
    if (!orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Try to find the PDF file in the local_server_data directory
    // First check if there's a stored PDF path in the database
    let pdfPath = null
    
    // Check today's folder first
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}` // YYYY-MM-DD format
    const todayPdfPath = path.join(process.cwd(), "local_server_data", today, `${invoiceId}.pdf`)
    
    if (fs.existsSync(todayPdfPath) && fs.statSync(todayPdfPath).size > 100) {
      pdfPath = todayPdfPath
    } else {
      // Search through all date folders for the PDF
      const localServerDataPath = path.join(process.cwd(), "local_server_data")
      if (fs.existsSync(localServerDataPath)) {
        const dateFolders = fs.readdirSync(localServerDataPath).filter(folder => 
          fs.statSync(path.join(localServerDataPath, folder)).isDirectory() && 
          /^\d{4}-\d{2}-\d{2}$/.test(folder)
        )
        
        for (const dateFolder of dateFolders) {
          const potentialPdfPath = path.join(localServerDataPath, dateFolder, `${invoiceId}.pdf`)
          if (fs.existsSync(potentialPdfPath) && fs.statSync(potentialPdfPath).size > 100) {
            pdfPath = potentialPdfPath
            break
          }
        }
      }
    }

    if (pdfPath) {
      // Read and return the existing PDF file
      const pdfBuffer = fs.readFileSync(pdfPath)
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"${invoiceId}.pdf\"`,
        },
      })
    } else {
      // If PDF doesn't exist, regenerate it using the order data
      const result = await regeneratePDF(orderData)
      if (result.success && fs.existsSync(result.pdf_path) && fs.statSync(result.pdf_path).size > 100) {
        const pdfBuffer = fs.readFileSync(result.pdf_path)
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=\"${invoiceId}.pdf\"`,
          },
        })
      } else {
        console.error("PDF generation failed or file is empty:", result)
        return NextResponse.json({ error: "PDF generation failed or file is empty" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error serving PDF:", error)
    return NextResponse.json({ error: "Failed to serve PDF" }, { status: 500 })
  }
}

async function getOrderData(invoiceId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "get_order.py")
    
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

async function regeneratePDF(orderData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "pdf_generator.py")
    
    // Create a temporary script to regenerate PDF
    const tempScript = `
import sys
import json
import os
from pdf_generator import generate_invoice_pdf
from datetime import datetime

order_data = ${JSON.stringify(orderData)}
today = datetime.now().strftime('%Y-%m-%d')
output_dir = f"local_server_data/{today}"
os.makedirs(output_dir, exist_ok=True)
pdf_path = os.path.join(output_dir, f"{order_data['invoice_id']}.pdf")

try:
    generate_invoice_pdf(order_data, pdf_path)
    result = {
        'success': True,
        'pdf_path': pdf_path
    }
except Exception as e:
    result = {
        'success': False,
        'error': str(e)
    }

print(json.dumps(result))
`
    
    const pythonProcess = spawn("python", ["-c", tempScript], {
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
