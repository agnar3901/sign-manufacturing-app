import nodemailer from 'nodemailer'
import path from 'path'

// SMTP configuration (fill with your real SMTP credentials)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true for 465 (SSL)
  auth: {
    user: process.env.SMTP_USER || 'your@email.com',
    pass: process.env.SMTP_PASS || 'yourpassword',
  },
}

export function generateInvoiceId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `INV_${timestamp}_${random}`
}

export function createInvoiceData(order: any) {
  return {
    company: {
      name: "Rangaa Digitals",
      address: "123 Business Street, City, State 12345",
      phone: "+91-9876543210",
      email: "info@rangaadigitals.com",
      website: "www.rangaadigitals.com",
    },
    invoice: {
      id: order.invoiceId,
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
    customer: {
      name: order.customerName,
      phone: order.phoneNumber,
      email: order.emailAddress,
    },
    items: [
      {
        description: `${order.itemType} - ${order.size}`,
        quantity: order.quantity,
        rate: order.rate,
        amount: order.total,
      },
    ],
    totals: {
      subtotal: order.total,
      tax: 0,
      total: order.total,
    },
    payment: {
      mode: order.paymentMode,
      delivery: order.deliveryType,
    },
    notes: order.notes || "",
  }
}

export async function sendNotifications(order: any) {
  // In production, implement actual integrations:

  // 1. WhatsApp via Twilio or Interakt
  await sendWhatsAppMessage(order)

  // 2. SMS via Twilio or MSG91
  await sendSMSMessage(order)

  // 3. Email via SMTP
  await sendEmailNotification(order)
}

async function sendWhatsAppMessage(order: any) {
  // Example Twilio WhatsApp integration
  console.log(`Sending WhatsApp to ${order.phoneNumber}`)
  console.log(`Message: Your order ${order.invoiceId} has been confirmed!`)

  // In production:
  // const client = twilio(accountSid, authToken)
  // await client.messages.create({
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:${order.phoneNumber}`,
  //   body: `Your order ${order.invoiceId} has been confirmed! Total: ₹${order.total}`
  // })
}

async function sendSMSMessage(order: any) {
  console.log(`Sending SMS to ${order.phoneNumber}`)
  console.log(`Message: Order ${order.invoiceId} confirmed. Total: ₹${order.total}`)

  // In production:
  // const client = twilio(accountSid, authToken)
  // await client.messages.create({
  //   from: '+1234567890',
  //   to: order.phoneNumber,
  //   body: `Order ${order.invoiceId} confirmed. Total: ₹${order.total}. Thank you for choosing SignCraft Pro!`
  // })
}

async function sendEmailNotification(order: any) {
  const transporter = nodemailer.createTransport(SMTP_CONFIG)
  const today = getDateFolder() // Use the consistent date function
  const pdfPath = path.join(process.cwd(), 'local_server_data', today, `${order.invoiceId}.pdf`)
  const mailOptions = {
    from: SMTP_CONFIG.auth.user,
    to: order.emailAddress,
    subject: `Rangaa Digitals Invoice - ${order.invoiceId}`,
    text: `Dear ${order.customerName},\n\nThank you for your order! Please find your invoice attached.\n\nBest regards,\nRangaa Digitals`,
    html: `<p>Dear ${order.customerName},</p><p>Thank you for your order! Please find your invoice attached.</p><p>Best regards,<br/>Rangaa Digitals</p>`,
    attachments: [
      {
        filename: `${order.invoiceId}.pdf`,
        path: pdfPath,
      },
    ],
  }
  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function getDateFolder(): string {
  // Use local date to avoid timezone issues for file organization
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}` // YYYY-MM-DD format
}
