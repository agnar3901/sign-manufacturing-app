import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

function getMonthName(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', { month: 'short' })
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all orders from the database
    const orders = await fetchOrdersFromDB()
    if (!orders) throw new Error("No orders found")

    // Aggregate analytics
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const ordersPerMonth = MONTHS.map(month => ({ month, count: 0 }))
    const revenuePerMonth = MONTHS.map(month => ({ month, revenue: 0 }))
    let pendingCount = 0
    let completedCount = 0

    for (const order of orders) {
      const month = getMonthName(order.createdAt)
      const idx = MONTHS.indexOf(month)
      // Calculate discounted total
      const discount = order.discount || 0;
      const discountedTotal = order.total - (order.total * discount / 100);
      if (idx !== -1) {
        ordersPerMonth[idx].count += 1
        revenuePerMonth[idx].revenue += discountedTotal
      }
      if (order.status === "pending") pendingCount++
      if (order.status === "completed") completedCount++
    }

    // Debug log to verify pending count (commented out to prevent console spam)
    // console.log(`Dashboard Stats - Total Orders: ${orders.length}, Pending: ${pendingCount}`)

    // Orders/Revenue per day for current week (Monday-Sunday, IST)
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const ordersPerDay = DAYS.map(day => ({ day, count: 0 }));
    const revenuePerDay = DAYS.map(day => ({ day, revenue: 0 }));
    // Get current IST time
    const now = new Date();
    const nowIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    // Get start of current week (Monday, IST)
    const istDayOfWeek = (nowIST.getDay() + 6) % 7; // 0=Monday
    const mondayIST = new Date(nowIST);
    mondayIST.setDate(nowIST.getDate() - istDayOfWeek);
    mondayIST.setHours(0,0,0,0);
    // End of week (Sunday, IST)
    const sundayIST = new Date(mondayIST);
    sundayIST.setDate(mondayIST.getDate() + 6);
    sundayIST.setHours(23,59,59,999);
    for (const order of orders) {
      // Convert order date to IST
      const orderDate = new Date(new Date(order.createdAt).getTime() + 5.5 * 60 * 60 * 1000);
      if (orderDate >= mondayIST && orderDate <= sundayIST) {
        // Map getDay() (0=Sunday, 1=Monday, ..., 6=Saturday) to DAYS (0=Monday, ..., 6=Sunday)
        let dayIdx = orderDate.getDay() === 0 ? 6 : orderDate.getDay() - 1;
        // Calculate discounted total
        const discount = order.discount || 0;
        const discountedTotal = order.total - (order.total * discount / 100);
        ordersPerDay[dayIdx].count += 1;
        revenuePerDay[dayIdx].revenue += discountedTotal;
      }
    }

    // Revenue per day for current month
    // Use existing 'now' variable
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    // Get number of days in this month
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
    const revenuePerDayOfMonth = Array(daysInMonth).fill(0);
    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear) {
        const dayIdx = orderDate.getDate() - 1;
        const discount = order.discount || 0;
        const discountedTotal = order.total - (order.total * discount / 100);
        revenuePerDayOfMonth[dayIdx] += discountedTotal;
      }
    }

    // This month's stats
    const thisMonthIdx = now.getMonth()
    const thisMonthOrders = ordersPerMonth[thisMonthIdx].count
    const thisMonthRevenue = revenuePerMonth[thisMonthIdx].revenue

    return NextResponse.json({
      totalOrders: orders.length,
      revenue: orders.reduce((sum, o) => {
        const discount = o.discount || 0;
        const discountedTotal = o.total - (o.total * discount / 100);
        return sum + discountedTotal;
      }, 0),
      customers: new Set(orders.map(o => o.customerName)).size,
      pending: pendingCount,
      completed: completedCount,
      ordersPerMonth,
      revenuePerMonth,
      ordersPerDay,
      revenuePerDay,
      revenuePerDayOfMonth,
      pendingCount,
      completedCount,
      thisMonthOrders,
      thisMonthRevenue: revenuePerMonth[thisMonthIdx].revenue,
      orders, // <-- add this line
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

async function fetchOrdersFromDB(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "get_orders.py")
    // Call with a large limit to get all orders
    const args = JSON.stringify({ limit: 10000, page: 1 })
    const pythonProcess = spawn("python", [scriptPath, args], {
      cwd: process.cwd(),
    })
    let stdout = ""
    let stderr = ""
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString()
    })
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString()
    })
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim())
          resolve(result.orders || [])
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`))
      }
    })
    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`))
    })
  })
} 