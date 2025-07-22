import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

export function LEDSignBoardQuotationForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    customerName: "",
    companyName: "",
    address: "",
    city: "",
    gender: "male",
    subject: "",
  })
  const [products, setProducts] = useState([
    { name: "", size: "", warranty: "", quantity: "", price1: "", price2: "" },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleGenderChange = (gender: string) => {
    setForm({ ...form, gender })
  }

  const handleProductChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newProducts = [...products]
    newProducts[idx][e.target.name as keyof typeof newProducts[0]] = e.target.value
    setProducts(newProducts)
  }

  const addProduct = () => {
    setProducts([...products, { name: "", size: "", warranty: "", quantity: "", price1: "", price2: "" }])
  }

  const removeProduct = (idx: number) => {
    setProducts(products.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/quotation/generate-led-sign-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, products }),
      })
      if (!res.ok) throw new Error("Failed to generate quotation")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "led-sign-board-quotation.docx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setOpen(false)
      setForm({ customerName: "", companyName: "", address: "", city: "", gender: "male", subject: "" })
      setProducts([{ name: "", size: "", warranty: "", quantity: "", price1: "", price2: "" }])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError(err.message || "Error generating quotation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="bg-[#23272f] text-gray-100 px-6 py-2 rounded-lg font-medium ml-2">
            New Quotation (LED Sign Board)
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl w-full min-h-[700px] flex flex-col gap-6 bg-[#181a20] rounded-2xl shadow-xl p-8 font-sans">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-400 mb-2">Generate LED Sign Board Quotation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Customer Name</Label>
                <Input name="customerName" value={form.customerName} onChange={handleFormChange} required disabled={loading} />
              </div>
              <div>
                <Label className="text-white">Company Name</Label>
                <Input name="companyName" value={form.companyName} onChange={handleFormChange} required disabled={loading} />
              </div>
              <div>
                <Label className="text-white">Address</Label>
                <Input name="address" value={form.address} onChange={handleFormChange} required disabled={loading} />
              </div>
              <div>
                <Label className="text-white">City</Label>
                <Input name="city" value={form.city} onChange={handleFormChange} required disabled={loading} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-white">Gender</Label>
                <Checkbox checked={form.gender === "male"} onCheckedChange={() => handleGenderChange("male")} /> Sir
                <Checkbox checked={form.gender === "female"} onCheckedChange={() => handleGenderChange("female")} /> Madam
              </div>
              <div>
                <Label className="text-white">Subject</Label>
                <Input name="subject" value={form.subject} onChange={handleFormChange} required disabled={loading} />
              </div>
            </div>
            <div className="mt-4">
              <Label className="text-white mb-2 block">Product Details</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>1st Quality Price</TableHead>
                    <TableHead>2nd Quality Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Input name="name" value={product.name} onChange={e => handleProductChange(idx, e)} required disabled={loading} /></TableCell>
                      <TableCell><Input name="size" value={product.size} onChange={e => handleProductChange(idx, e)} required disabled={loading} /></TableCell>
                      <TableCell><Input name="warranty" value={product.warranty} onChange={e => handleProductChange(idx, e)} required disabled={loading} /></TableCell>
                      <TableCell><Input name="quantity" value={product.quantity} onChange={e => handleProductChange(idx, e)} required disabled={loading} /></TableCell>
                      <TableCell><Input name="price1" value={product.price1} onChange={e => handleProductChange(idx, e)} required disabled={loading} /></TableCell>
                      <TableCell><Input name="price2" value={product.price2} onChange={e => handleProductChange(idx, e)} required disabled={loading} /></TableCell>
                      <TableCell>
                        {products.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeProduct(idx)} disabled={loading}>Remove</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button type="button" variant="secondary" className="mt-2" onClick={addProduct} disabled={loading}>Add Product</Button>
            </div>
            <div className="mt-4 text-sm font-semibold text-red-400">GST Extra 18% applicable</div>
            <div className="mt-4 text-xs text-gray-400 whitespace-pre-line">
              (Warranty for LED Lighting and Hp Latex printing work)
              {"\n"}Including Meterial Transportation, Mounting and Labor charges
              {"\n"}Advance Payment : 80% to be paid in advance along with the Purchase Order,BalancePayment within one week from the date of delivery / completion of the work
            </div>
            <div className="mt-6 text-right">
              <div className="mb-8 text-sm text-gray-300">Yours Sincerely<br/>For Rangaa Sign Factory</div>
              <div className="h-12" /> {/* Space for signature */}
            </div>
            {error && <div className="text-red-500 text-xs text-center w-full max-w-md">{error}</div>}
            <Button type="submit" className="w-full py-2 text-base font-semibold rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 focus:ring-2 focus:ring-blue-400" disabled={loading} style={{ fontWeight: 600 }}>
              {loading ? "Generating..." : "Generate Quotation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {success && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium transition-all duration-500 animate-fade-in">
            Quotation DOCX generated and downloaded successfully!
          </div>
        </div>
      )}
    </>
  )
} 