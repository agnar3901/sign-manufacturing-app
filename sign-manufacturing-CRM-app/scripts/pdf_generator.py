from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import os
from datetime import datetime

def generate_invoice_pdf(order_data, output_path):
    """
    Generate a professional PDF invoice using ReportLab.
    
    Args:
        order_data (dict): Order information
        output_path (str): Path where PDF will be saved
    """
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Container for the 'Flowable' objects
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2563eb')
    )
    
    company_style = ParagraphStyle(
        'CompanyStyle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_CENTER,
        spaceAfter=2
    )
    
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.HexColor('#1f2937')
    )
    
    # Company Header
    story.append(Paragraph("Ranga Sign Factory", title_style))
    story.append(Paragraph("Professional Sign Design & Manufacturing", company_style))
    story.append(Paragraph("Sasikanth nagar, RTO off road, KKD- 533005", company_style))
    story.append(Paragraph("Phone: +91 7842269999 | Email: rangasignfactory@gmail.com", company_style))
    story.append(Spacer(1, 10))
    
    # Invoice Details
    invoice_data = [
        ['Invoice Number:', order_data['invoice_id']],
        ['Date:', datetime.now().strftime('%B %d, %Y')],
        ['Due Date:', (datetime.now()).strftime('%B %d, %Y')]
    ]
    
    invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
    invoice_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(invoice_table)
    story.append(Spacer(1, 20))
    
    # Customer Information
    story.append(Paragraph("Bill To:", heading_style))
    customer_info = f"""
    <b>{order_data['customer_name']}</b><br/>
    Phone: {order_data['phone_number']}<br/>
    Email: {order_data['email_address']}
    """
    story.append(Paragraph(customer_info, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Order Details Table
    story.append(Paragraph("Order Details:", heading_style))
    # Build description with material and lamination if present
    description = order_data['item_type']
    extra_lines = []
    if order_data.get('material'):
        extra_lines.append(f"Material: {order_data['material']}")
    if order_data.get('item_type') == 'foam' and 'lamination' in order_data:
        extra_lines.append(f"Lamination: {'Yes' if order_data['lamination'] else 'No'}")
    if extra_lines:
        description += '<br/>' + '<br/>'.join(extra_lines)

    order_table_data = [
        ['Description', 'Size', 'Quantity', 'Rate', 'Amount'],
        [
            description,
            order_data['size'],
            str(order_data['quantity']),
            f"₹{order_data['rate']:.2f}",
            f"₹{order_data['total']:.2f}"
        ]
    ]
    
    order_table = Table(order_table_data, colWidths=[2.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
    order_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(order_table)
    story.append(Spacer(1, 20))
    
    # Total Section
    subtotal = order_data['quantity'] * order_data['rate']
    discount = order_data.get('discount', 0)
    total_after_discount = subtotal - (subtotal * discount / 100)
    total_data = [
        ['Subtotal:', f"₹{subtotal:.2f}"],
    ]
    if discount:
        total_data.append([f"Discount ({discount}%):", f"-₹{(subtotal * discount / 100):.2f}"])
        total_data.append(['', ''])  # Blank line for spacing
    total_data.append(['Total Amount:', f"₹{total_after_discount:.2f}"])
    
    total_table = Table(total_data, colWidths=[4*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
    ]))
    
    story.append(total_table)
    story.append(Spacer(1, 20))
    
    # Payment and Delivery Information
    payment_info = f"""
    <b>Payment Mode:</b> {order_data['payment_mode']}<br/>
    <b>Delivery Type:</b> {order_data['delivery_type']}
    """
    story.append(Paragraph(payment_info, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Notes (if any)
    if order_data.get('notes'):
        story.append(Paragraph("Notes:", heading_style))
        story.append(Paragraph(order_data['notes'], styles['Normal']))
        story.append(Spacer(1, 20))
    
    # Footer
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("Thank you for choosing Ranga Sign Factory!", footer_style))
    story.append(Paragraph("For any queries, please contact us at +91 7842269999", footer_style))
    
    # Build PDF
    doc.build(story)
    import sys
    print(f"PDF invoice generated: {output_path}", file=sys.stderr)

def create_sample_invoice():
    """Create a sample invoice for testing"""
    sample_order = {
        'invoice_id': 'INV_SAMPLE_001',
        'customer_name': 'John Doe',
        'phone_number': '+91-9876543210',
        'email_address': 'john@example.com',
        'item_type': 'Flex Banner',
        'size': '4x6 feet',
        'quantity': 2,
        'rate': 150.00,
        'total': 300.00,
        'payment_mode': 'Cash',
        'delivery_type': 'Local Pickup',
        'notes': 'Rush order for promotional event'
    }
    
    # Create output directory
    output_dir = "local_server_data/sample_invoices"
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, f"{sample_order['invoice_id']}.pdf")
    generate_invoice_pdf(sample_order, output_path)

if __name__ == "__main__":
    create_sample_invoice()
