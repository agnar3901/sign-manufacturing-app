"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, FileText, Printer } from "lucide-react"
import React from "react"

const MATERIAL_OPTIONS: Record<string, string[]> = {
  flex: [
    "china blacklight",
    "star backlight",
    "star",
    "white",
    "black flex",
    "blackout",
  ],
  vinyl: [
    "3M",
    "avery",
    "LG",
    "texture vinyl",
    "radium",
    "forsted vinyl",
    "1 way vision",
  ],
  foam: ["3mm", "5mm", "8mm", "12mm", "18mm"],
}

const orderSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  emailAddress: z.string().email("Invalid email address"),
  itemType: z.string().min(1, "Please select an item type"),
  material: z.string().optional(),
  size: z.string().min(1, "Size is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be a positive number"),
  lamination: z.boolean().optional(),
  discount: z.number().min(0).max(100).optional(),
  deliveryType: z.string().min(1, "Please select delivery type"),
  paymentMode: z.string().min(1, "Please select payment mode"),
  notes: z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>

interface CustomerOrderFormProps {
  onOrderSubmitted: () => void
}

export function CustomerOrderForm({ onOrderSubmitted }: CustomerOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastInvoiceId, setLastInvoiceId] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  })

  const watchedValues = watch()
  const [materialOptions, setMaterialOptions] = useState<string[]>([])
  const [showMaterial, setShowMaterial] = useState(false)

  // Watch itemType and update material options
  const itemType = watchedValues.itemType
  React.useEffect(() => {
    if (itemType === "flex" || itemType === "vinyl" || itemType === "foam") {
      setMaterialOptions(MATERIAL_OPTIONS[itemType])
      setShowMaterial(true)
    } else {
      setShowMaterial(false)
    }
  }, [itemType])

  const subtotal = (watchedValues.quantity || 0) * (watchedValues.rate || 0)
  const discount = watchedValues.discount || 0
  const total = subtotal - (subtotal * discount / 100)

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to submit order")
      }

      const result = await response.json()
      
      if (result.success) {
        setLastInvoiceId(result.invoiceId)

        // Show detailed success message with notification status
        const notificationStatus = result.notifications || {}
        const notificationMessages = []
        let whatsappStatus = null
        let emailStatus = null
        
        // Check email status
        if (result.emailSent) {
          notificationMessages.push("Email ✅")
        } else {
          notificationMessages.push("Email ❌")
          emailStatus = "Failed to send email. Check SMTP configuration."
        }
        
        if (notificationStatus.whatsapp) {
          if (notificationStatus.whatsapp.success) {
            notificationMessages.push("WhatsApp ✅")
          } else {
            notificationMessages.push("WhatsApp ❌")
            whatsappStatus = notificationStatus.whatsapp.error || "Failed to send WhatsApp message."
          }
        }
        if (notificationStatus.sms) {
          notificationMessages.push("SMS")
        }

        const notificationText = notificationMessages.length > 0 
          ? `Sent via: ${notificationMessages.join(", ")}`
          : ""

        toast({
          title: "Order Submitted Successfully! 🎉",
          description: `Invoice ${result.invoiceId} has been generated and sent to the customer. ${notificationText}${emailStatus ? `\nEmail: ${emailStatus}` : ""}${whatsappStatus ? `\nWhatsApp: ${whatsappStatus}` : ""}`,
        })

        reset()
        onOrderSubmitted()
      } else {
        throw new Error(result.error || "Failed to process order")
      }
    } catch (error) {
      console.error("Order submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintInvoice = async () => {
    if (!lastInvoiceId) return

    try {
      const response = await fetch(`/api/orders/${lastInvoiceId}/print`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${lastInvoiceId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          New Customer Order
        </CardTitle>
        <CardDescription>Fill in the customer details and order information to generate an invoice</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input id="customerName" {...register("customerName")} placeholder="Enter customer name" />
              {errors.customerName && <p className="text-sm text-red-600">{errors.customerName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input id="phoneNumber" {...register("phoneNumber")} placeholder="Enter phone number" />
              {errors.phoneNumber && <p className="text-sm text-red-600">{errors.phoneNumber.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emailAddress">Email Address *</Label>
              <Input id="emailAddress" type="email" {...register("emailAddress")} placeholder="Enter email address" />
              {errors.emailAddress && <p className="text-sm text-red-600">{errors.emailAddress.message}</p>}
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type *</Label>
              <Select onValueChange={(value) => setValue("itemType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex">Flex Banner</SelectItem>
                  <SelectItem value="vinyl">Vinyl Sticker</SelectItem>
                  <SelectItem value="led">LED Sign Board</SelectItem>
                  <SelectItem value="foam">Foamboards Sign Boards</SelectItem>
                  <SelectItem value="acrylic">Acrylic Sign</SelectItem>
                  <SelectItem value="metal">Metal Sign</SelectItem>
                  <SelectItem value="wooden">Wooden Sign</SelectItem>
                  <SelectItem value="digital">Digital Print</SelectItem>
                </SelectContent>
              </Select>
              {errors.itemType && <p className="text-sm text-red-600">{errors.itemType.message}</p>}
            </div>
            {/* Material/Variant Dropdown */}
            {showMaterial && (
              <div className="space-y-2">
                <Label htmlFor="material">Material/Variant</Label>
                <Select onValueChange={(value) => setValue("material", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material/variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="size">Size *</Label>
              <Input id="size" {...register("size")} placeholder="e.g., 4x6 feet, 12x18 inches" />
              {errors.size && <p className="text-sm text-red-600">{errors.size.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register("quantity", { valueAsNumber: true })}
                placeholder="Enter quantity"
              />
              {errors.quantity && <p className="text-sm text-red-600">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (₹) *</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                {...register("rate", { valueAsNumber: true })}
                placeholder="Enter rate per unit"
              />
              {errors.rate && <p className="text-sm text-red-600">{errors.rate.message}</p>}
            </div>
          </div>

          {/* Lamination Checkbox */}
          {itemType === "foam" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lamination"
                {...register("lamination")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="lamination">Lamination</Label>
            </div>
          )}

          {/* Discount Input */}
          <div className="flex items-center gap-2">
            <Label htmlFor="discount">Discount %</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...register("discount", { valueAsNumber: true })}
              placeholder="Enter discount percentage"
              className="w-32"
            />
          </div>

          {/* Total Display */}
          {total > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount (after discount):</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Delivery and Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="deliveryType">Delivery Type *</Label>
              <Select onValueChange={(value) => setValue("deliveryType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Local Pickup</SelectItem>
                  <SelectItem value="delivery">Home Delivery</SelectItem>
                  <SelectItem value="courier">Courier Service</SelectItem>
                </SelectContent>
              </Select>
              {errors.deliveryType && <p className="text-sm text-red-600">{errors.deliveryType.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode *</Label>
              <Select onValueChange={(value) => setValue("paymentMode", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="online">Online Transfer</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMode && <p className="text-sm text-red-600">{errors.paymentMode.message}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Any special instructions or notes..." rows={3} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Order...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Order & Generate Invoice
                </>
              )}
            </Button>

            {lastInvoiceId && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintInvoice}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <Printer className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
