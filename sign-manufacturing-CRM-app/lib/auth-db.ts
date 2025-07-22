import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

interface User {
  id: number
  username: string
  password: string
  full_name: string
  role: string
  created_at: string
}

class AuthDB {
  private dbPath: string
  private users: User[] = []

  constructor() {
    this.dbPath = path.join(process.cwd(), 'local_server_data', 'database', 'users.json')
    this.ensureDbExists()
    this.loadUsers()
  }

  private ensureDbExists() {
    const dbDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2))
    }
  }

  private loadUsers() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8')
      this.users = JSON.parse(data)
    } catch (error) {
      console.error('Error loading users:', error)
      this.users = []
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.users, null, 2))
    } catch (error) {
      console.error('Error saving users:', error)
      throw error
    }
  }

  async createUser(username: string, password: string, fullName: string, role: string = 'user'): Promise<User> {
    // Check if user already exists
    const existingUser = this.users.find(u => u.username === username)
    if (existingUser) {
      throw new Error('Username already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const now = new Date().toISOString()
    const newUser: User = {
      id: this.users.length + 1,
      username,
      password: hashedPassword,
      full_name: fullName,
      role,
      created_at: now
    }

    this.users.push(newUser)
    this.saveUsers()

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser
    return userWithoutPassword as User
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const user = this.users.find(u => u.username === username)
    return user || null
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
  }

  async createDefaultAdmin(): Promise<void> {
    const existingAdmin = this.users.find(u => u.username === 'admin')
    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    try {
      await this.createUser('admin', 'admin123', 'System Administrator', 'admin')
      console.log('✅ Default admin user created successfully!')
      console.log('Username: admin')
      console.log('Password: admin123')
    } catch (error) {
      console.error('Error creating default admin:', error)
    }
  }

  // List all users (without passwords)
  async listUsers(): Promise<Omit<User, 'password'>[]> {
    return this.users.map(({ password, ...rest }) => rest)
  }

  // Delete a user by username
  async deleteUser(username: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.username === username)
    if (index === -1) return false
    this.users.splice(index, 1)
    this.saveUsers()
    return true
  }
}

export const authDB = new AuthDB() 