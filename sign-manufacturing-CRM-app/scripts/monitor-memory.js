#!/usr/bin/env node

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const LOG_FILE = path.join(__dirname, '../logs/memory-usage.log')
const INTERVAL = 30000 // 30 seconds
const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE)
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

function getTimestamp() {
  return new Date().toISOString()
}

function logToFile(message) {
  const logEntry = `[${getTimestamp()}] ${message}\n`
  fs.appendFileSync(LOG_FILE, logEntry)
  
  // Rotate log file if it gets too large
  const stats = fs.statSync(LOG_FILE)
  if (stats.size > MAX_LOG_SIZE) {
    const backupFile = LOG_FILE.replace('.log', `.${Date.now()}.log`)
    fs.renameSync(LOG_FILE, backupFile)
    console.log(`Log file rotated to: ${backupFile}`)
  }
}

function getProcessMemoryUsage(pid) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `wmic process where ProcessId=${pid} get WorkingSetSize /format:value`
      : `ps -p ${pid} -o rss=`
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      
      let memoryKB = 0
      if (process.platform === 'win32') {
        // Parse Windows output: WorkingSetSize=1234567
        const match = stdout.match(/WorkingSetSize=(\d+)/)
        if (match) {
          memoryKB = parseInt(match[1]) / 1024
        }
      } else {
        // Parse Unix output: 123456
        memoryKB = parseInt(stdout.trim())
      }
      
      const memoryMB = Math.round(memoryKB / 1024)
      resolve(memoryMB)
    })
  })
}

function findNodeProcess() {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32'
      ? 'tasklist /FI "IMAGENAME eq node.exe" /FO CSV'
      : 'ps aux | grep "node.*next" | grep -v grep'
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      
      if (process.platform === 'win32') {
        // Parse Windows CSV output
        const lines = stdout.split('\n').filter(line => line.includes('node.exe'))
        if (lines.length > 0) {
          const parts = lines[0].split(',')
          const pid = parseInt(parts[1].replace(/"/g, ''))
          resolve(pid)
        } else {
          reject(new Error('No Node.js process found'))
        }
      } else {
        // Parse Unix output
        const lines = stdout.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          const parts = lines[0].split(/\s+/)
          const pid = parseInt(parts[1])
          resolve(pid)
        } else {
          reject(new Error('No Node.js process found'))
        }
      }
    })
  })
}

async function monitorMemory() {
  try {
    const pid = await findNodeProcess()
    const memoryMB = await getProcessMemoryUsage(pid)
    
    const message = `PID: ${pid} | Memory Usage: ${memoryMB}MB`
    console.log(message)
    logToFile(message)
    
  } catch (error) {
    const errorMessage = `Error monitoring memory: ${error.message}`
    console.error(errorMessage)
    logToFile(errorMessage)
  }
}

// Start monitoring
console.log(`Starting memory monitoring every ${INTERVAL / 1000} seconds...`)
console.log(`Log file: ${LOG_FILE}`)

// Initial check
monitorMemory()

// Set up interval
const intervalId = setInterval(monitorMemory, INTERVAL)

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping memory monitoring...')
  clearInterval(intervalId)
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nStopping memory monitoring...')
  clearInterval(intervalId)
  process.exit(0)
}) 