import { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function QuotationForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    clientName: "",
    clientCompany: "",
    clientNumber: "",
    clientEmail: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/quotation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to generate quotation")
      const blob = await res.blob()
      // Download the docx file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "quotation.docx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setOpen(false)
      setForm({ clientName: "", clientCompany: "", clientNumber: "", clientEmail: "" })
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
          <Button
            variant="default"
            className="bg-[#23272f] text-gray-100 px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-[#31343b] focus:ring-2 focus:ring-blue-600"
          >
            New Quotation (LED display)
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl w-full min-h-[600px] flex flex-row justify-between items-center bg-[#181a20] rounded-2xl shadow-xl p-8 font-sans gap-8">
          {/* Left: Header and Description */}
          <div className="flex-1 flex flex-col justify-center items-start">
            <DialogHeader className="w-full">
              <DialogTitle className="text-2xl font-bold text-blue-400 mb-2">Generate New Quotation</DialogTitle>
            </DialogHeader>
            <div className="mb-5">
              <p className="text-gray-400 text-sm leading-relaxed">
                Enter client details to generate a quotation PDF for LED display. The document will include your info, package options, and terms. Download starts after submit.
              </p>
            </div>
          </div>
          {/* Right: Form */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-4 flex flex-col items-center">
            <div className="w-full max-w-md">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Client Name</label>
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-700 bg-[#23272f] text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter client name"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div className="w-full max-w-md">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Client Company Name</label>
              <input
                type="text"
                name="clientCompany"
                value={form.clientCompany}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-700 bg-[#23272f] text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter company name"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div className="w-full max-w-md">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Client Number</label>
              <input
                type="text"
                name="clientNumber"
                value={form.clientNumber}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-700 bg-[#23272f] text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter client number"
                style={{ fontWeight: 400 }}
              />
            </div>
            <div className="w-full max-w-md">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Client Email</label>
              <input
                type="email"
                name="clientEmail"
                value={form.clientEmail}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-700 bg-[#23272f] text-gray-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter client email"
                style={{ fontWeight: 400 }}
              />
            </div>
            {error && <div className="text-red-500 text-xs text-center w-full max-w-md">{error}</div>}
            <div className="flex justify-end w-full max-w-md">
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-base font-semibold rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 focus:ring-2 focus:ring-blue-400"
                style={{ fontWeight: 600 }}
              >
                {loading ? "Generating..." : "Generate Quotation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {success && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium transition-all duration-500 animate-fade-in">
            Quotation PDF generated and downloaded successfully!
          </div>
        </div>
      )}
    </>
  )
}
