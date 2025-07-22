# Memory Monitoring Guide

This guide explains how to monitor RAM usage for your sign manufacturing app.

## Quick Start

### 1. **Automatic Monitoring (Development)**
The app automatically logs memory usage every 60 seconds when running in development mode.

```bash
npm run dev
```

You'll see logs like:
```
[MEMORY] RSS: 156MB | Heap Total: 89MB | Heap Used: 67MB | External: 12MB | ArrayBuffers: 2MB | Uptime: 120s
```

### 2. **Manual Memory Check**
Check current memory usage via API:

```bash
curl http://localhost:3000/api/system/memory
```

Response:
```json
{
  "success": true,
  "data": {
    "rss": 156,
    "heapTotal": 89,
    "heapUsed": 67,
    "external": 12,
    "arrayBuffers": 2,
    "timestamp": 1703123456789,
    "uptime": 120
  },
  "timestamp": "2023-12-21T10:30:56.789Z"
}
```

### 3. **Command Line Monitoring**
Monitor memory usage from the command line:

```bash
npm run monitor-memory
```

This will:
- Find your Node.js process automatically
- Log memory usage every 30 seconds
- Save logs to `logs/memory-usage.log`
- Rotate log files when they exceed 10MB

### 4. **Development with Memory Monitoring**
Start both the dev server and memory monitoring:

```bash
npm run dev-with-memory
```

## Memory Metrics Explained

- **RSS (Resident Set Size)**: Total memory allocated to the process
- **Heap Total**: Total heap memory allocated by V8
- **Heap Used**: Actual heap memory being used
- **External**: Memory used by C++ objects bound to JavaScript
- **ArrayBuffers**: Memory for ArrayBuffers and SharedArrayBuffers

## API Endpoints

### GET `/api/system/memory`
Returns current memory usage statistics.

### POST `/api/system/memory`
Logs current memory usage to console.

```bash
curl -X POST http://localhost:3000/api/system/memory \
  -H "Content-Type: application/json" \
  -d '{"action": "log"}'
```

## Programmatic Usage

### In Your Code
```typescript
import { getMemoryUsage, logMemoryUsage, startMemoryMonitoring } from '@/lib/memory-monitor'

// Get current memory usage
const usage = getMemoryUsage()
console.log(`Memory: ${usage.rss}MB`)

// Log memory usage
logMemoryUsage()

// Start continuous monitoring
startMemoryMonitoring(30000) // Every 30 seconds
```

### Memory Monitor Class
```typescript
import { MemoryMonitor } from '@/lib/memory-monitor'

const monitor = MemoryMonitor.getInstance()
monitor.startMonitoring(60000) // Every 60 seconds
monitor.stopMonitoring()
```

## Log Files

### Console Logs
Memory usage is logged to the console with timestamps.

### File Logs
When using the command line monitor, logs are saved to:
- `logs/memory-usage.log` - Current log file
- `logs/memory-usage.{timestamp}.log` - Rotated log files

## Performance Considerations

### Memory Usage Patterns
- **Normal**: 50-200MB for a typical Next.js app
- **High**: 200-500MB during heavy operations
- **Concerning**: 500MB+ may indicate memory leaks

### When to Monitor
- During development to catch memory leaks
- Before and after major operations
- In production for performance optimization
- When experiencing slow performance

## Troubleshooting

### High Memory Usage
1. Check for memory leaks in components
2. Look for large data structures
3. Monitor during specific operations
4. Use browser dev tools for client-side memory

### Monitoring Not Working
1. Ensure the app is running
2. Check console for errors
3. Verify file permissions for log directory
4. Restart the monitoring process

## Production Deployment

### Environment Variables
```bash
# Enable memory monitoring in production
NODE_ENV=production
ENABLE_MEMORY_MONITORING=true
```

### Log Rotation
The monitoring script automatically rotates logs when they exceed 10MB.

### Security
The memory API endpoints should be protected in production environments.

## Customization

### Change Log Interval
```typescript
// In your code
startMemoryMonitoring(15000) // 15 seconds

// In command line script
const INTERVAL = 15000 // Edit scripts/monitor-memory.js
```

### Custom Log Format
Modify the `logMemoryUsage()` function in `lib/memory-monitor.ts` to change the log format.

### Add Alerts
Extend the monitoring to send alerts when memory usage exceeds thresholds:

```typescript
const usage = getMemoryUsage()
if (usage.rss > 500) {
  console.warn('High memory usage detected!')
  // Send email, Slack notification, etc.
}
```

## Integration with Monitoring Tools

### Prometheus/Grafana
Export memory metrics for visualization:

```typescript
// Add to your monitoring
const usage = getMemoryUsage()
console.log(`# HELP node_memory_rss_megabytes Memory usage in MB`)
console.log(`# TYPE node_memory_rss_megabytes gauge`)
console.log(`node_memory_rss_megabytes ${usage.rss}`)
```

### Health Checks
Include memory usage in health check endpoints:

```typescript
// In your health check API
const usage = getMemoryUsage()
const isHealthy = usage.rss < 500 // 500MB threshold

return {
  status: isHealthy ? 'healthy' : 'unhealthy',
  memory: usage,
  timestamp: new Date().toISOString()
}
``` 