"use client"

import { useEffect, useState } from "react"
import { Bar, Pie, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js"
import { Loader2 } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

function getCurrentMonthIndex() {
  return new Date().getMonth()
}

export default function AnalyticsModal() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/stats/monthly")
        const data = await res.json()
        if (res.ok) {
          setStats(data)
        } else {
          setError(data.error || "Failed to fetch analytics")
        }
      } catch (err) {
        setError("Failed to fetch analytics")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Prepare data for charts
  const ordersPerMonth = Array(12).fill(0)
  const revenuePerMonth = Array(12).fill(0)
  if (stats?.ordersPerMonth) {
    stats.ordersPerMonth.forEach((d: any) => {
      const idx = MONTHS.indexOf(d.month)
      if (idx !== -1) ordersPerMonth[idx] = d.count
    })
  }
  if (stats?.revenuePerMonth) {
    stats.revenuePerMonth.forEach((d: any) => {
      const idx = MONTHS.indexOf(d.month)
      if (idx !== -1) revenuePerMonth[idx] = d.revenue
    })
  }
  const thisMonthIdx = getCurrentMonthIndex()
  const thisMonthOrders = ordersPerMonth[thisMonthIdx]
  const thisMonthRevenue = revenuePerMonth[thisMonthIdx]
  const pendingCount = stats?.pendingCount ?? stats?.pending ?? 0
  const completedCount = stats?.completedCount ?? stats?.completed ?? 0

  // Prepare data for per-day charts (current week)
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const ordersPerDay = stats?.ordersPerDay ? stats.ordersPerDay.map((d: any) => d.count) : Array(7).fill(0);
  const revenuePerDay = stats?.revenuePerDay ? stats.revenuePerDay.map((d: any) => d.revenue) : Array(7).fill(0);

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 mb-4 text-blue-500" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-8">{error}</div>
      ) : stats ? (
        <div className="space-y-6">
          {/* This Month's Stats */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <div className="bg-blue-50 rounded-lg px-6 py-4 text-center shadow">
              <div className="text-2xl font-bold text-blue-700">{thisMonthOrders}</div>
              <div className="text-sm text-muted-foreground">Orders in {MONTHS[thisMonthIdx]}</div>
            </div>
            <div className="bg-green-50 rounded-lg px-6 py-4 text-center shadow">
              <div className="text-2xl font-bold text-green-700">₹{thisMonthRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Revenue in {MONTHS[thisMonthIdx]}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Orders per Month */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">Orders per Month</h3>
              <Bar
                data={{
                  labels: MONTHS,
                  datasets: [
                    {
                      label: "Orders",
                      data: ordersPerMonth,
                      backgroundColor: "#3b82f6",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Month" },
                    },
                    y: {
                      title: { display: true, text: "Number of Orders" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {/* Revenue per Month */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-2 text-green-700">Revenue per Month</h3>
              <Bar
                data={{
                  labels: MONTHS,
                  datasets: [
                    {
                      label: "Revenue",
                      data: revenuePerMonth,
                      backgroundColor: "#10b981",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Month" },
                    },
                    y: {
                      title: { display: true, text: "Revenue (₹)" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {/* Orders per Day (Current Week) */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">Orders per Day (This Week)</h3>
              <Bar
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      label: "Orders",
                      data: ordersPerDay,
                      backgroundColor: "#6366f1",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Day" },
                    },
                    y: {
                      title: { display: true, text: "Number of Orders" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {/* Revenue per Day (Current Week) */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-lg mb-2 text-green-700">Revenue per Day (This Week)</h3>
              <Bar
                data={{
                  labels: DAYS,
                  datasets: [
                    {
                      label: "Revenue",
                      data: revenuePerDay,
                      backgroundColor: "#34d399",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Day" },
                    },
                    y: {
                      title: { display: true, text: "Revenue (₹)" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {/* Revenue per Day (Current Month) - Line Graph */}
            <div className="bg-white rounded-lg shadow p-4 col-span-1 md:col-span-2">
              <h3 className="font-semibold text-lg mb-2 text-green-700">Revenue per Day (This Month)</h3>
              <Line
                data={{
                  labels: stats?.revenuePerDayOfMonth ? Array.from({length: stats.revenuePerDayOfMonth.length}, (_, i) => (i+1).toString()) : [],
                  datasets: [
                    {
                      label: "Revenue",
                      data: stats?.revenuePerDayOfMonth || [],
                      borderColor: "#10b981",
                      backgroundColor: "rgba(16,185,129,0.1)",
                      fill: true,
                      tension: 0.3,
                      pointRadius: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: false },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Day of Month" },
                    },
                    y: {
                      title: { display: true, text: "Revenue (₹)" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {/* Pending vs Completed Orders (Bar) */}
            <div className="bg-white rounded-lg shadow p-4 col-span-1 flex flex-col items-center">
              <h3 className="font-semibold text-lg mb-2 text-purple-700">Pending vs Completed Orders (Bar)</h3>
              <Bar
                data={{
                  labels: ["Pending", "Completed"],
                  datasets: [
                    {
                      label: "Orders",
                      data: [pendingCount, completedCount],
                      backgroundColor: ["#f59e42", "#22d3ee"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: "Status" },
                    },
                    y: {
                      title: { display: true, text: "Number of Orders" },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {/* Pending vs Completed Orders (Pie) */}
            <div className="bg-white rounded-lg shadow p-4 col-span-1 flex flex-col items-center">
              <h3 className="font-semibold text-lg mb-2 text-purple-700">Pending vs Completed Orders (Pie)</h3>
              <Pie
                data={{
                  labels: ["Pending", "Completed"],
                  datasets: [
                    {
                      data: [pendingCount, completedCount],
                      backgroundColor: ["#f59e42", "#22d3ee"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "bottom" as const },
                  },
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
} 