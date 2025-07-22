"use client"

import { useEffect, useState, useMemo } from "react"
import { CustomerOrderForm } from "@/components/customer-order-form"
import { OrderHistory } from "@/components/order-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, FileText, Users, TrendingUp, LogOut, User, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import ManageUsersTable from "./manage-users-table"
import AnalyticsModal from "./analytics-modal"

export default function AdminPage() {
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Dashboard stats state (full access for admin)
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    customers: 0,
    pending: 0,
    ordersPerDay: [] as { count: number }[],
    revenuePerDay: [] as { revenue: number }[],
    orders: [] as any[],
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState("")

  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)

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

    // Redirect non-admin users to dashboard
    if (userObj.role !== "admin") {
      router.push("/dashboard")
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
        setStats(data)
      } catch (err) {
        setStatsError("Could not load stats")
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [refreshHistory])

  const handleOrderSubmitted = () => {
    setRefreshHistory((prev) => prev + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("isAuthenticated")
    router.push("/auth")
  }

  // Calculate today's stats
  const todayIdx = (() => {
    // Monday=0, Sunday=6 in our data, but getDay() is 0=Sunday
    const d = new Date();
    let idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return idx;
  })();
  const todayOrders = stats.ordersPerDay?.[todayIdx]?.count || 0;
  const todayRevenue = stats.revenuePerDay?.[todayIdx]?.revenue || 0;
  // Calculate today's unique customers if stats.orders is available
  let todayCustomers = 0;
  if (Array.isArray(stats.orders)) {
    const now = new Date();
    const nowIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const istDayOfWeek = (nowIST.getDay() + 6) % 7;
    const mondayIST = new Date(nowIST);
    mondayIST.setDate(nowIST.getDate() - istDayOfWeek);
    mondayIST.setHours(0,0,0,0);
    const todayIST = new Date(nowIST);
    todayIST.setHours(0,0,0,0);
    const tomorrowIST = new Date(todayIST);
    tomorrowIST.setDate(todayIST.getDate() + 1);
    const customersSet = new Set();
    stats.orders.forEach((order: any) => {
      const orderDate = new Date(new Date(order.createdAt).getTime() + 5.5 * 60 * 60 * 1000);
      if (orderDate >= todayIST && orderDate < tomorrowIST) {
        customersSet.add(order.customerName);
      }
    });
    todayCustomers = customersSet.size;
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 gap-4 md:gap-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Rangaa Digitals - Admin</h1>
            <p className="text-lg text-gray-600">It's a Creative Edge</p>
            <p className="text-base text-gray-500">Administrative Dashboard</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span className="truncate max-w-[120px] sm:max-w-xs">{user.full_name} (Admin)</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="whitespace-nowrap">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards (Full access for admin) */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : `₹${stats.revenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats.customers.toLocaleString()}
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
        {/* Today's Stats Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOrders}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{todayRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCustomers}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>
        {statsError && <div className="text-red-600 text-center mb-4">{statsError}</div>}

        {/* Administrative Tools - moved to top */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Administrative Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                className="h-20 w-full rounded-lg border flex flex-col items-center justify-center hover:bg-blue-100 transition"
                onClick={() => setShowUsersModal(true)}
              >
                <Users className="h-6 w-6 mx-auto mb-2" />
                <span>Manage Users</span>
              </button>
              <button
                className="h-20 w-full rounded-lg border flex flex-col items-center justify-center hover:bg-blue-100 transition"
                onClick={() => setShowAnalyticsModal(true)}
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <span>Analytics</span>
              </button>
              <button
                className="h-20 w-full rounded-lg border flex flex-col items-center justify-center hover:bg-blue-100 transition"
                onClick={() => alert('System Settings coming soon!')}
              >
                <Package className="h-6 w-6 mx-auto mb-2" />
                <span>System Settings</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="new-order" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-order">New Order</TabsTrigger>
            <TabsTrigger value="order-history">Order History</TabsTrigger>
          </TabsList>

          <TabsContent value="new-order">
            <CustomerOrderForm onOrderSubmitted={handleOrderSubmitted} />
          </TabsContent>

          <TabsContent value="order-history">
            <OrderHistory key={refreshHistory} />
          </TabsContent>
        </Tabs>

        {/* Manage Users Modal */}
        <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
          <DialogContent className="w-full max-w-lg sm:max-w-2xl px-2 sm:px-6 py-4 sm:py-8">
            <DialogHeader>
              <DialogTitle>Manage Users</DialogTitle>
              <DialogDescription>
                Add, view, and delete users.
              </DialogDescription>
            </DialogHeader>
            {user && <ManageUsersTable currentUsername={user.username} />}
            <DialogFooter>
              <DialogClose asChild>
                <button className="btn btn-primary">Close</button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Analytics Modal */}
        <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
          <DialogContent className="w-full max-w-2xl lg:max-w-4xl px-2 sm:px-6 py-4 sm:py-8">
            <DialogHeader>
              <DialogTitle>Analytics</DialogTitle>
              <DialogDescription>
                Visualize order and revenue analytics.
              </DialogDescription>
            </DialogHeader>
            <AnalyticsModal />
            <DialogFooter>
              <DialogClose asChild>
                <button className="btn btn-primary">Close</button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 