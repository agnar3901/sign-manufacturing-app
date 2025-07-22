import { NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx"

// In-memory counter for quotation number (replace with DB or file for production)
let quotationCounter = 28

function getNextQuotationNumber() {
  quotationCounter++
  return `QUO-${quotationCounter.toString().padStart(3, '0')}`
}

function getCurrentDate() {
  const now = new Date()
  return now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

const HEADER_COLOR = "#4F8CD6" // blue for headers
const BODY_FONT = "Calibri"
const HEADER_FONT = "Microsoft JhengHei UI"
const BLACK = "000000"
const WHITE = "FFFFFF"
const HEADING_SIZE = 32 // 16pt in half-points (docx uses half-points)
const MARGIN_TWIPS = 864 // 0.6 inch = 864 twips

export async function POST(request: NextRequest) {
  try {
    const { clientName, clientCompany, clientNumber, clientEmail } = await request.json()
    if (!clientName || !clientCompany || !clientNumber || !clientEmail) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const quotationNumber = getNextQuotationNumber()
    const date = getCurrentDate()

    // Build the DOCX document
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: BODY_FONT,
              color: BLACK,
              size: 22,
            },
            paragraph: {
              spacing: { after: 100 },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: MARGIN_TWIPS, right: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS },
            },
          },
          children: [
            // Main Header
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: "Ranga Sign Factory",
                  bold: true,
                  size: 48,
                  font: HEADER_FONT,
                  color: HEADER_COLOR.replace('#', ''),
                }),
              ],
              spacing: { after: 80 },
            }),
            // Horizontal line after header
            new Paragraph({
              border: {
                bottom: { color: HEADER_COLOR.replace('#', ''), space: 1, style: "single", size: 6 },
              },
              spacing: { after: 120 },
            }),
            // Address and contact
            new Paragraph({ children: [new TextRun({ text: "Sasikanth Nagar, RTO office road, Kakinada, 533005", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Phone: +91-91933959999", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Email: rangakakinada@gmail.com", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "GSTIN: 37ADWPP4342B2ZB", font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 200 } }),
            // Quotation Title
            new Paragraph({ children: [new TextRun({ text: "Quotation", bold: true, size: 32, font: BODY_FONT, color: HEADER_COLOR.replace('#', '') })], spacing: { after: 40 } }),
            new Paragraph({ children: [new TextRun({ text: `Date: ${date}`, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: `Quotation Number: ${quotationNumber}`, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 60 } }),
            // Free line before To:
            new Paragraph({ children: [new TextRun({ text: "" })] }),
            // To:
            new Paragraph({ children: [new TextRun({ text: "To:", bold: true, size: HEADING_SIZE, color: HEADER_COLOR.replace('#', ''), font: BODY_FONT })], spacing: { after: 10 } }),
            new Paragraph({ children: [new TextRun({ text: clientName, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 10 } }),
            new Paragraph({ children: [new TextRun({ text: clientCompany, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 10 } }),
            new Paragraph({ children: [new TextRun({ text: clientNumber, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 10 } }),
            new Paragraph({ children: [new TextRun({ text: clientEmail, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 40 } }),
            // Free line after To:
            new Paragraph({ children: [new TextRun({ text: "" })] }),
            // Subject
            new Paragraph({ children: [new TextRun({ text: "Subject: Quotation for LED Advertisement Display at Bhanugudi Junction, Kakinada", font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 60 } }),
            // Free line after Subject
            new Paragraph({ children: [new TextRun({ text: "" })] }),
            // Advertisement Package Options Header
            new Paragraph({ children: [new TextRun({ text: "Advertisement Package Options", bold: true, size: HEADING_SIZE, color: HEADER_COLOR.replace('#', ''), font: BODY_FONT })], spacing: { after: 40 } }),
            // Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({ shading: { fill: HEADER_COLOR.replace('#', '') }, children: [new Paragraph({ children: [new TextRun({ text: "Package", bold: true, color: WHITE, font: BODY_FONT, size: 22 })] })] }),
                    new TableCell({ shading: { fill: HEADER_COLOR.replace('#', '') }, children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true, color: WHITE, font: BODY_FONT, size: 22 })] })] }),
                    new TableCell({ shading: { fill: HEADER_COLOR.replace('#', '') }, children: [new Paragraph({ children: [new TextRun({ text: "Ad Slot Length", bold: true, color: WHITE, font: BODY_FONT, size: 22 })] })] }),
                    new TableCell({ shading: { fill: HEADER_COLOR.replace('#', '') }, children: [new Paragraph({ children: [new TextRun({ text: "Frequency", bold: true, color: WHITE, font: BODY_FONT, size: 22 })] })] }),
                    new TableCell({ shading: { fill: HEADER_COLOR.replace('#', '') }, children: [new Paragraph({ children: [new TextRun({ text: "Cost (INR)", bold: true, color: WHITE, font: BODY_FONT, size: 22 })] })] }),
                  ],
                }),
                ...[
                  ["Daily", "1 Day", "25–30 seconds", "70–90 times/day", "₹2,000"],
                  ["Weekly", "1 Week", "25–30 seconds", "70–90 times/day", "₹10,500"],
                  ["Monthly", "1 Month", "25–30 seconds", "70–90 times/day", "₹20,000"],
                  ["Quarterly", "3 Months", "25–30 seconds", "70–90 times/day", "₹48,000"],
                ].map(row => new TableRow({
                  children: row.map(cell => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: cell, font: BODY_FONT, size: 22, color: BLACK })] })],
                  })),
                })),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                left: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                right: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BLACK },
              },
            }),
            // Free line before Terms & Conditions
            new Paragraph({ children: [new TextRun({ text: "" })] }),
            // Terms & Conditions
            new Paragraph({ children: [new TextRun({ text: "Terms & Conditions", bold: true, size: HEADING_SIZE, color: HEADER_COLOR.replace('#', ''), font: BODY_FONT })], spacing: { before: 120, after: 20 } }),
            new Paragraph({ children: [new TextRun({ text: "• All rates are inclusive of display charges. An additional 18% GST will be applicable as per government regulations.", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "• Content must be provided in MP4 or high-resolution JPG format.", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "• Content approval is subject to advertisement regulations.", font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 60 } }),
            // Free line after Terms & Conditions
            new Paragraph({ children: [new TextRun({ text: "" })] }),
            // Payment Details
            new Paragraph({ children: [new TextRun({ text: "Payment Details", bold: true, size: HEADING_SIZE, color: HEADER_COLOR.replace('#', ''), font: BODY_FONT })], spacing: { after: 20 } }),
            new Paragraph({ children: [
              new TextRun({ text: "Payments can be made via ", font: BODY_FONT, size: 22, color: BLACK }),
              new TextRun({ text: "Cheque, Cash, or Bank Transfer", bold: true, font: BODY_FONT, size: 22, color: BLACK }),
              new TextRun({ text: ". Detailed bank account information will be provided upon request.", font: BODY_FONT, size: 22, color: BLACK }),
            ] }),
            new Paragraph({ children: [new TextRun({ text: "We hope you find this quotation satisfactory. Please feel free to contact us for any clarification or customization. We look forward to doing business with you.", font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 60 } }),
            // Add extra space and a free line before signature
            new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 120 } }),
            new Paragraph({ children: [new TextRun({ text: "" })] }),
            // Signature
            new Paragraph({ children: [new TextRun({ text: "Authorized Signatory", bold: true, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Ranga Sign Factory", font: BODY_FONT, size: 22, color: BLACK })] }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=quotation_${quotationNumber}.docx`,
      },
    })
  } catch (error) {
    console.error("Quotation generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
