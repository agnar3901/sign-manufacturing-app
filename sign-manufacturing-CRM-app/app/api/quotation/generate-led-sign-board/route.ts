import { NextRequest, NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx"

let quotationCounter = 100
function getNextQuotationNumber() {
  quotationCounter++
  return `LED-QUO-${quotationCounter.toString().padStart(3, '0')}`
}
function getCurrentDate() {
  const now = new Date()
  return now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}
const HEADER_COLOR = "#D32F2F"
const GREEN = "00A86B"
const BLACK = "000000"
const BODY_FONT = "Calibri"
const HEADER_FONT = "Microsoft JhengHei UI"
const HEADING_SIZE = 32
const MARGIN_TWIPS = 864

export async function POST(request: NextRequest) {
  try {
    const { customerName, companyName, address, city, gender, subject, products } = await request.json()
    if (!customerName || !companyName || !address || !city || !gender || !subject || !products || !products.length) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }
    const quotationNumber = getNextQuotationNumber()
    const date = getCurrentDate()
    // Compose salutation
    const salutation = gender === "male" ? "Respected Sir," : "Respected Madam,";
    // Build DOCX
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: BODY_FONT, color: BLACK, size: 22 },
            paragraph: { spacing: { after: 100 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: { margin: { top: MARGIN_TWIPS, right: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS } },
          },
          children: [
            // Header
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({ text: "RANGA SIGN FACTORY", bold: true, size: 48, font: HEADER_FONT, color: HEADER_COLOR.replace('#', '') }),
              ],
              spacing: { after: 20 },
            }),
            new Paragraph({ children: [new TextRun({ text: "D.No.-70-17A-11A,RANGA DIGITALS, Sasikanth Nagar", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "RTO Office Road, Kakinada-533 005, (A.P)", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Cell: 9133959999", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "GST No: 37ADWPP4342B2ZB", font: BODY_FONT, size: 22, color: GREEN, bold: true })], spacing: { after: 100 } }),
            // Date and Quotation
            new Paragraph({ children: [new TextRun({ text: `Date: ${date}`, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Quotation", bold: true, size: 32, font: BODY_FONT, color: HEADER_COLOR.replace('#', '') })], spacing: { after: 40 } }),
            // To
            new Paragraph({ children: [new TextRun({ text: "To", bold: true, size: 28, color: BLACK, font: BODY_FONT })], spacing: { after: 10 } }),
            new Paragraph({ children: [new TextRun({ text: customerName, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: companyName, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: address, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: city, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 40 } }),
            // Salutation and Subject
            new Paragraph({ children: [new TextRun({ text: salutation, font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: `Sub: ${subject}`, font: BODY_FONT, size: 22, color: BLACK })], spacing: { after: 40 } }),
            // Table header
            new Paragraph({ children: [new TextRun({ text: "NAME OF THE PRODUCTS", bold: true, size: 24, color: BLACK, font: BODY_FONT })], spacing: { after: 10 } }),
            // Product Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Product Name", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Size", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Warranty", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1st Quality Price", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "2nd Quality Price", bold: true })] })] }),
                  ],
                }),
                ...products.map((prod: any) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prod.name || "" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prod.size || "" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prod.warranty || "" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prod.quantity || "" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prod.price1 || "" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prod.price2 || "" })] })] }),
                  ],
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
            // GST
            new Paragraph({ children: [new TextRun({ text: "GST Extra 18% applicable", bold: true, color: HEADER_COLOR.replace('#', ''), font: BODY_FONT })], spacing: { after: 40 } }),
            // Terms
            new Paragraph({ children: [new TextRun({ text: "(Warranty for LED Lighting and Hp Latex printing work)", font: BODY_FONT, size: 20, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Including Meterial Transportation, Mounting and Labor charges", font: BODY_FONT, size: 20, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "Advance Payment : 80% to be paid in advance along with the Purchase Order,BalancePayment within one week from the date of delivery / completion of the work", font: BODY_FONT, size: 20, color: BLACK })], spacing: { after: 40 } }),
            // Signature
            new Paragraph({ children: [new TextRun({ text: "Yours Sincerely", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: "For Rangaa Sign Factory", font: BODY_FONT, size: 22, color: BLACK })] }),
            new Paragraph({ children: [new TextRun({ text: " " })] }),
            new Paragraph({ children: [new TextRun({ text: " " })] }),
            new Paragraph({ children: [new TextRun({ text: "Proprietor", font: BODY_FONT, size: 22, color: BLACK })] }),
            // Bank details
            new Paragraph({ children: [new TextRun({ text: "BANK DETAILS: A/C. NO. 120001146443, NAME: RANGA SIGN FACTORY, IFSC: CNRB0013259, CANARA BANK, GANDHINAGAR BRANCH, KAKINADA-4", font: BODY_FONT, size: 18, color: BLACK })] }),
          ],
        },
      ],
    })
    const buffer = await Packer.toBuffer(doc)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=led-sign-board-quotation_${quotationNumber}.docx`,
      },
    })
  } catch (error) {
    console.error("LED Sign Board Quotation generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 