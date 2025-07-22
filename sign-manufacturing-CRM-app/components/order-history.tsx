"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Eye, Filter, Check, Calendar as CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"

interface Order {
  id: string
  invoiceId: string
  customerName: string
  phoneNumber: string
  emailAddress: string
  itemType: string
  size: string
  quantity: number
  rate: number
  total: number
  deliveryType: string
  paymentMode: string
  status: string
  createdAt: string
  notes?: string
  discount?: number
}

interface OrderHistoryProps {
  onOrderModified?: () => void
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
]

export function OrderHistory({ onOrderModified }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [updating, setUpdating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Get user role from localStorage
  const [userRole, setUserRole] = useState<string | null>(null)
  // Removed showCalendar and selectedDate state
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 15
  const MAX_ORDERS_PER_DAY = 1000
  const [cachedPages, setCachedPages] = useState<{ [page: number]: Order[] }>({})
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  // Fetch and cache top 2 pages on mount
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.role)
      } catch {}
    }
    setLoading(true)
    const token = localStorage.getItem("token")
    Promise.all([
      fetch(`/api/orders/database?page=1&limit=${ordersPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/orders/database?page=2&limit=${ordersPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([res1, res2]) => {
        const data1 = await res1.json()
        const data2 = await res2.json()
        setCachedPages({ 1: data1.orders || [], 2: data2.orders || [] })
        setTotalOrders(data1.total || 0)
        setOrders(data1.orders || [])
        setLoading(false)
      })
      .catch(() => {
        setCachedPages({})
        setOrders([])
        setTotalOrders(0)
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        })
      })
  }, [])

  // When a date is selected, set selectedDate and reset page
  const handleCalendarOk = () => {
    setCurrentPage(1)
    setStatusFilter("all")
    setCalendarOpen(false)
  }

  // Fetch orders for current page, search, status, or selected date
  useEffect(() => {
    const token = localStorage.getItem("token")
    
    setLoading(true)
    let url
    if (selectedDate) {
      // For date selection, fetch all orders for that day (no pagination)
      // Use local date format to avoid timezone issues
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      url = `/api/orders/database?date=${dateStr}&page=1&limit=${MAX_ORDERS_PER_DAY}`
    } else {
      url = `/api/orders/database?page=${currentPage}&limit=${ordersPerPage}`
      if (statusFilter === "pending") {
        url += `&status=pending`
      } else if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }
    }
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data.orders) ? data.orders : [])
        setTotalOrders(typeof data.total === "number" ? data.total : 0)
        if (selectedDate) setStatusFilter("all")
      })
      .catch(() => {
        setOrders([])
        setTotalOrders(0)
        toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [currentPage, searchTerm, statusFilter, cachedPages, selectedDate])

  // Filter by status (client-side, after fetching page)
  const filteredOrders = statusFilter === "all" || statusFilter === "pending"
    ? orders || []
    : (orders || []).filter(order => order.status === statusFilter)

  // Pagination logic
  let totalPages, paginatedOrders
  if (selectedDate) {
    // For date selection, show all orders on one page
    totalPages = 1
    paginatedOrders = filteredOrders
  } else if (statusFilter === "pending") {
    totalPages = 1
    paginatedOrders = filteredOrders
  } else {
    totalPages = Math.ceil(totalOrders / ordersPerPage)
    paginatedOrders = filteredOrders.slice(
      (currentPage - 1) * ordersPerPage,
      currentPage * ordersPerPage
    )
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/orders/${invoiceId}/print`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${invoiceId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    // Use Tailwind classes for color
    let colorClass = "bg-gray-200 text-gray-800"
    let label = status.charAt(0).toUpperCase() + status.slice(1)
    if (status === "delivered") {
      colorClass = "bg-green-500 text-white"
    } else if (status === "processing") {
      colorClass = "bg-orange-500 text-white"
    } else if (status === "pending") {
      colorClass = "bg-red-500 text-white"
    } else if (status === "completed") {
      colorClass = "bg-blue-500 text-white"
    }
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>{label}</span>
  }

  const handleStatusClick = (orderId: string, currentStatus: string) => {
    setEditingStatusId(orderId)
    setNewStatus(currentStatus)
  }

  const handleStatusUpdate = async (invoiceId: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update status")
      setEditingStatusId(null)
      toast({ title: "Status updated!" })
      
      // Notify parent component that orders were modified
      onOrderModified?.()
      
      // Re-fetch data based on current filter
      setLoading(true)
      const token = localStorage.getItem("token")
      
      if (statusFilter === "pending") {
        // Re-fetch all pending orders
        fetch(`/api/orders/database?status=pending&page=1&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            setOrders(Array.isArray(data.orders) ? data.orders : [])
            setTotalOrders(typeof data.total === "number" ? data.total : 0)
          })
          .catch(() => {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
          })
          .finally(() => setLoading(false))
      } else {
        // Re-fetch the current page
        fetch(`/api/orders/database?page=${currentPage}&limit=${ordersPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            setCachedPages({ ...cachedPages, [currentPage]: data.orders })
            setTotalOrders(data.total)
          })
          .catch(() => {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
          })
          .finally(() => setLoading(false))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading orders...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Order History
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Select date">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="flex flex-col items-center gap-2">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => setSelectedDate(date ?? null)}
                  initialFocus
                />
                <button
                  className="mt-2 px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                  disabled={!selectedDate || calendarLoading}
                  onClick={handleCalendarOk}
                >
                  {calendarLoading ? "Loading..." : "OK"}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </CardTitle>
        <CardDescription>View and manage all customer orders and invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Removed calendar modal */}
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by customer name, invoice ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending (All)</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter === "pending" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setStatusFilter("all")
                setCurrentPage(1)
              }}
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* Orders Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoiceId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.itemType}</div>
                        <div className="text-sm text-gray-500">{order.size}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell className="font-medium">₹{
                      order.discount
                        ? (order.total - (order.total * order.discount / 100)).toFixed(2)
                        : order.total.toFixed(2)
                    }</TableCell>
                    <TableCell>
                      <Popover open={editingStatusId === order.id} onOpenChange={(open) => { if (!open) setEditingStatusId(null) }}>
                        <PopoverTrigger asChild>
                          <div
                            className="cursor-pointer inline-block"
                            onClick={() => handleStatusClick(order.id, order.status)}
                          >
                            {getStatusBadge(order.status)}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-48">
                          <div className="mb-2 font-medium">Change Status</div>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            className="mt-3 w-full"
                            size="sm"
                            disabled={updating || newStatus === order.status}
                            onClick={() => handleStatusUpdate(order.invoiceId)}
                          >
                            <Check className="mr-1 h-4 w-4" /> Update
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>{
                      order.createdAt
                        ? new Date(order.createdAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''
                    }</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => downloadInvoice(order.invoiceId)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {userRole === "admin" && (
                        <AlertDialog open={deleteDialogOpen && orderToDelete?.invoiceId === order.invoiceId} onOpenChange={open => { setDeleteDialogOpen(open); if (!open) setOrderToDelete(null) }}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="ml-2" onClick={() => { setOrderToDelete(order); setDeleteDialogOpen(true) }}>Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete order <b>{order.invoiceId}</b>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                              <AlertDialogAction disabled={deleting} onClick={async () => {
                                if (!orderToDelete) return
                                setDeleting(true)
                                try {
                                  const token = localStorage.getItem("token")
                                  const res = await fetch(`/api/orders/${orderToDelete.invoiceId}/status`, {
                                    method: "DELETE",
                                    headers: { "Authorization": `Bearer ${token}` },
                                  })
                                  const data = await res.json()
                                  if (res.ok && data.success) {
                                    toast({ title: "Order deleted!" })
                                    setDeleteDialogOpen(false)
                                    setOrderToDelete(null)
                                    
                                    // Notify parent component that orders were modified
                                    onOrderModified?.()
                                    // Re-fetch data based on current filter
                                    setLoading(true)
                                    const token = localStorage.getItem("token")
                                    
                                    if (statusFilter === "pending") {
                                      // Re-fetch all pending orders
                                      fetch(`/api/orders/database?status=pending&page=1&limit=1000`, {
                                        headers: { Authorization: `Bearer ${token}` },
                                      })
                                        .then(res => res.json())
                                        .then(data => {
                                          setOrders(Array.isArray(data.orders) ? data.orders : [])
                                          setTotalOrders(typeof data.total === "number" ? data.total : 0)
                                        })
                                        .catch(() => {
                                          toast({ title: "Error", description: "Failed to delete order", variant: "destructive" })
                                        })
                                        .finally(() => setLoading(false))
                                    } else {
                                      // Re-fetch the current page
                                      fetch(`/api/orders/database?page=${currentPage}&limit=${ordersPerPage}`, {
                                        headers: { Authorization: `Bearer ${token}` },
                                      })
                                        .then(res => res.json())
                                        .then(data => {
                                          setCachedPages({ ...cachedPages, [currentPage]: data.orders })
                                          setTotalOrders(data.total)
                                        })
                                        .catch(() => {
                                          toast({ title: "Error", description: "Failed to delete order", variant: "destructive" })
                                        })
                                        .finally(() => setLoading(false))
                                    }
                                  } else {
                                    toast({ title: "Error", description: data.error || "Failed to delete order", variant: "destructive" })
                                  }
                                } catch (err) {
                                  toast({ title: "Error", description: "Failed to delete order", variant: "destructive" })
                                } finally {
                                  setDeleting(false)
                                }
                              }}>Continue Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={page === currentPage ? "font-bold" : ""}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600">
              {statusFilter === "pending" ? "Pending Orders" : "Total Orders"}
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalOrders}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600">Total Revenue</div>
            <div className="text-2xl font-bold text-green-900">
              ₹{orders.reduce((sum, order) => {
                const discountedTotal = order.discount 
                  ? order.total - (order.total * order.discount / 100)
                  : order.total
                return sum + discountedTotal
              }, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600">
              {statusFilter === "pending" ? "Orders Shown" : "Pending Orders"}
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {statusFilter === "pending" ? totalOrders : orders.filter((order) => order.status === "pending").length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
