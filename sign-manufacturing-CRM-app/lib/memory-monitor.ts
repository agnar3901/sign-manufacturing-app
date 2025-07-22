import { performance } from 'perf_hooks'

interface MemoryUsage {
  rss: number // Resident Set Size (total memory allocated)
  heapTotal: number // Total heap memory allocated
  heapUsed: number // Heap memory actually used
  external: number // Memory used by C++ objects bound to JavaScript objects
  arrayBuffers: number // Memory allocated for ArrayBuffers and SharedArrayBuffers
  timestamp: number
  uptime: number
}

export class MemoryMonitor {
  private static instance: MemoryMonitor
  private intervalId: NodeJS.Timeout | null = null
  private logInterval: number = 30000 // 30 seconds default

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }

  getCurrentMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage()
    return {
      rss: Math.round(memUsage.rss / 1024 / 1024), // Convert to MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
      timestamp: Date.now(),
      uptime: Math.round(process.uptime())
    }
  }

  logMemoryUsage(): void {
    const usage = this.getCurrentMemoryUsage()
    const logMessage = `[MEMORY] RSS: ${usage.rss}MB | Heap Total: ${usage.heapTotal}MB | Heap Used: ${usage.heapUsed}MB | External: ${usage.external}MB | ArrayBuffers: ${usage.arrayBuffers}MB | Uptime: ${usage.uptime}s`
    
    console.log(logMessage)
    
    // Also log to a file if needed
    if (process.env.NODE_ENV === 'production') {
      // In production, you might want to write to a log file
      console.log(`[${new Date().toISOString()}] ${logMessage}`)
    }
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.intervalId) {
      this.stopMonitoring()
    }
    
    this.logInterval = intervalMs
    console.log(`[MEMORY] Starting memory monitoring every ${intervalMs / 1000} seconds`)
    
    this.intervalId = setInterval(() => {
      this.logMemoryUsage()
    }, intervalMs)
    
    // Log initial memory usage
    this.logMemoryUsage()
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[MEMORY] Memory monitoring stopped')
    }
  }

  getMemoryStats(): {
    current: MemoryUsage
    peak: MemoryUsage | null
    average: { rss: number; heapUsed: number } | null
  } {
    return {
      current: this.getCurrentMemoryUsage(),
      peak: null, // Could be implemented with tracking
      average: null // Could be implemented with tracking
    }
  }
}

// Convenience functions
export const getMemoryUsage = () => MemoryMonitor.getInstance().getCurrentMemoryUsage()
export const logMemoryUsage = () => MemoryMonitor.getInstance().logMemoryUsage()
export const startMemoryMonitoring = (intervalMs?: number) => MemoryMonitor.getInstance().startMonitoring(intervalMs)
export const stopMemoryMonitoring = () => MemoryMonitor.getInstance().stopMonitoring() 