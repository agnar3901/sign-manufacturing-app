"use client"

import { useEffect, useState } from "react"
import { CustomerOrderForm } from "@/components/customer-order-form"
import { OrderHistory } from "@/components/order-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, FileText, LogOut, User, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QuotationForm } from "@/components/quotation-form"
import { LEDSignBoardQuotationForm } from "@/components/led-sign-board-quotation-form"

export default function DashboardPage() {
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Dashboard stats state (limited for regular users)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState("")

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userData = localStorage.getItem("user")

    if (!isAuthenticated || !userData) {
      router.push("/auth")
      return
    }

    const userObj = JSON.parse(userData)
    setUser(userObj)

    // Redirect admin users to admin page
    if (userObj.role === "admin") {
      router.push("/admin")
      return
    }
  }, [router])

  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true)
      setStatsError("")
      try {
        const res = await fetch("/api/stats/monthly")
        if (!res.ok) throw new Error("Failed to fetch stats")
        const data = await res.json()
        setStats({
          totalOrders: data.totalOrders,
          pending: data.pending,
        })
      } catch (err) {
        setStatsError("Could not load stats")
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [refreshHistory])

  const handleOrderSubmitted = () => {
    setRefreshHistory((prev) => prev + 1)
  }

  const handleOrderModified = () => {
    // Refresh stats when orders are modified (status update, delete, etc.)
    setRefreshHistory((prev) => prev + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    router.push("/auth")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Rangaa Digitals</h1>
            <p className="text-lg text-gray-600">It's a Creative Edge</p>
            <p className="text-base text-gray-500">Order Management Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <QuotationForm />
            <LEDSignBoardQuotationForm />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.full_name}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards (Limited for regular users) */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRefreshHistory(prev => prev + 1)}
            disabled={loadingStats}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
            {loadingStats ? "Refreshing..." : "Refresh Stats"}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats.totalOrders.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats.pending.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Orders to process</p>
            </CardContent>
          </Card>
        </div>
        {statsError && <div className="text-red-600 text-center mb-4">{statsError}</div>}

        {/* Main Content */}
        <Tabs defaultValue="new-order" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-order">New Order</TabsTrigger>
            <TabsTrigger value="order-history">Order History</TabsTrigger>
          </TabsList>

          <TabsContent value="new-order">
            <CustomerOrderForm onOrderSubmitted={handleOrderSubmitted} />
          </TabsContent>

          <TabsContent value="order-history">
            <OrderHistory key={refreshHistory} onOrderModified={handleOrderModified} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 