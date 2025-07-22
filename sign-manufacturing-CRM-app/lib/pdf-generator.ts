// PDF generation utility
// In production, you would use libraries like jsPDF, PDFKit, or Puppeteer

import PDFDocument from "pdfkit"

export async function generatePDFInvoice(orderData: any): Promise<Buffer> {
  // This is a simplified implementation
  // In production, use proper PDF generation libraries

  const htmlContent = generateInvoiceHTML(orderData)

  // Convert HTML to PDF (simplified for demo)
  // In production, use Puppeteer or similar:
  // const browser = await puppeteer.launch()
  // const page = await browser.newPage()
  // await page.setContent(htmlContent)
  // const pdf = await page.pdf({ format: 'A4' })
  // await browser.close()
  // return pdf

  // For demo, return a simple text buffer
  const pdfContent = `
RANGAA DIGITALS - INVOICE
========================

Invoice ID: ${orderData.invoiceId}
Date: ${new Date(orderData.createdAt).toLocaleDateString()}

CUSTOMER DETAILS:
Name: ${orderData.customerName}
Phone: ${orderData.phoneNumber}
Email: ${orderData.emailAddress}

ORDER DETAILS:
Item: ${orderData.itemType}
Size: ${orderData.size}
Quantity: ${orderData.quantity}
Rate: ₹${orderData.rate}
Total: ₹${orderData.total}

Payment Mode: ${orderData.paymentMode}
Delivery: ${orderData.deliveryType}

Notes: ${orderData.notes || "None"}

Thank you for your business!
Contact: +91-9876543210
Email: info@rangaadigitals.com
  `

  return Buffer.from(pdfContent, "utf-8")
}

export async function generateQuotationPDF(quotationData: any): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const buffers: Buffer[] = []
  doc.on('data', buffers.push.bind(buffers))

  // Header
  doc
    .fontSize(24)
    .fillColor('#4F8EF7')
    .text('Ranga Sign Factory', { align: 'left' })
    .moveDown(0.5)
    .fillColor('black')
    .fontSize(10)
    .text('Sasikanth Nagar, RTO office road, Kakinada, 533005')
    .text('Phone: +91-91939359999')
    .text('Email: rangakakinada@gmail.com')
    .text('GSTIN: 37ADWPP4342B2B')
    .moveDown(1)
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke()
    .moveDown(1)

  // Quotation
  doc.fontSize(14).font('Helvetica-Bold').text('Quotation').moveDown(0.5)
  doc.font('Helvetica').fontSize(11)
  doc.text(`Date: ${quotationData.date}`)
  doc.text(`Quotation Number: ${quotationData.quotationNumber}`)
  doc.moveDown(0.5)

  // To
  doc.font('Helvetica-Bold').text('To:')
  doc.font('Helvetica')
  doc.text(quotationData.clientName)
  doc.text(quotationData.clientCompany)
  doc.text(quotationData.clientNumber)
  doc.text(quotationData.clientEmail)
  doc.moveDown(0.5)

  // Subject
  doc.font('Helvetica-Bold').text('Subject:', { continued: true })
  doc.font('Helvetica').text(' Quotation for LED Advertisement Display at Bhanugudi Junction, Kakinada')
  doc.moveDown(1)

  // Advertisement Package Options Table
  doc.font('Helvetica-Bold').text('Advertisement Package Options').moveDown(0.5)
  const tableTop = doc.y
  const colWidths = [80, 80, 100, 120, 80]
  const startX = doc.x
  const headers = ['Package', 'Duration', 'Ad Slot Length', 'Frequency', 'Cost (INR)']
  const rows = [
    ['Daily', '1 Day', '25–30 seconds', '70–90 times/day', '₹2,000'],
    ['Weekly', '1 Week', '25–30 seconds', '70–90 times/day', '₹10,500'],
    ['Monthly', '1 Month', '25–30 seconds', '70–90 times/day', '₹20,000'],
    ['Quarterly', '3 Months', '25–30 seconds', '70–90 times/day', '₹48,000'],
  ]
  // Draw table header
  doc.font('Helvetica-Bold').fontSize(10)
  let x = startX
  headers.forEach((header, i) => {
    doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' })
    x += colWidths[i]
  })
  doc.moveDown(0.5)
  // Draw table rows
  let y = tableTop + 16
  rows.forEach(row => {
    x = startX
    row.forEach((cell, i) => {
      doc.font('Helvetica').fontSize(10).text(cell, x, y, { width: colWidths[i], align: 'left' })
      x += colWidths[i]
    })
    y += 16
  })
  doc.moveDown(5)

  // Terms & Conditions
  doc.font('Helvetica-Bold').text('Terms & Conditions').moveDown(0.2)
  doc.font('Helvetica').fontSize(10)
  doc.text('• All rates are inclusive of display charges. An additional 18% GST will be applicable as per government regulations.')
  doc.text('• Content must be provided in MP4 or high-resolution JPG format.')
  doc.text('• Content approval is subject to advertisement regulations.')
  doc.moveDown(1)

  // Payment Details
  doc.font('Helvetica-Bold').text('Payment Details').moveDown(0.2)
  doc.font('Helvetica').fontSize(10)
  doc.text('Payments can be made via Cheque, Cash, or Bank Transfer. Detailed bank account information will be provided upon request.')
  doc.moveDown(1)

  doc.font('Helvetica').fontSize(10)
  doc.text('We hope you find this quotation satisfactory. Please feel free to contact us for any clarification or customization. We look forward to doing business with you.')
  doc.moveDown(1)

  doc.text('Authorized Signatory')
  doc.text('Ranga Sign Factory')

  doc.end()

  return new Promise((resolve) => {
    const onEnd = () => resolve(Buffer.concat(buffers))
    doc.on('end', onEnd)
  })
}

function generateInvoiceHTML(orderData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${orderData.invoiceId}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .invoice-details { margin: 20px 0; }
        .customer-details { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th, .order-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .order-table th { background: #2563eb; color: white; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin: 20px 0; }
        .footer { margin-top: 40px; text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Ranga Sign Factory</div>
        <p>Professional Sign Design & Manufacturing</p>
        <p>Sasikanth nagar, RTO off road, KKD- 533005</p>
        <p>Phone: +91 7842269999 | Email: rangasignfactory@gmail.com</p>
      </div>
      
      <div class="invoice-details">
        <h2>Invoice #${orderData.invoiceId}</h2>
        <p><strong>Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
      </div>
      
      <div class="customer-details">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${orderData.customerName}</p>
        <p><strong>Phone:</strong> ${orderData.phoneNumber}</p>
        <p><strong>Email:</strong> ${orderData.emailAddress}</p>
      </div>
      
      <table class="order-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Size</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              ${orderData.itemType}
              ${orderData.material ? `<br/><span style='font-size:12px;color:#555;'>Material: ${orderData.material}</span>` : ""}
              ${(orderData.itemType === 'foam' && typeof orderData.lamination !== 'undefined') ? `<br/><span style='font-size:12px;color:#555;'>Lamination: ${orderData.lamination ? 'Yes' : 'No'}</span>` : ""}
            </td>
            <td>${orderData.size}</td>
            <td>${orderData.quantity}</td>
            <td>₹${orderData.rate}</td>
            <td>₹${orderData.total}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total">
        ${orderData.discount ? `<p>Discount: ${orderData.discount}%</p>` : ""}
        <p>Total Amount: ₹${orderData.total}</p>
        <p>Payment Mode: ${orderData.paymentMode}</p>
        <p>Delivery Type: ${orderData.deliveryType}</p>
      </div>
      
      ${orderData.notes ? `<div><strong>Notes:</strong> ${orderData.notes}</div>` : ""}
      
      <div class="footer">
        <p>Thank you for choosing Ranga Sign Factory!</p>
        <p>For any queries, contact us at +91 7842269999</p>
      </div>
    </body>
    </html>
  `
}
