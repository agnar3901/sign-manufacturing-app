"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus, Loader2 } from "lucide-react"

interface User {
  id: number
  username: string
  full_name: string
  role: string
  created_at: string
}

export default function ManageUsersTable({ currentUsername }: { currentUsername: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addForm, setAddForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "user",
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")
  const [addSuccess, setAddSuccess] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/users")
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || "Failed to fetch users")
      }
    } catch (err) {
      setError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (username: string) => {
    if (!window.confirm(`Are you sure you want to delete user '${username}'?`)) return
    setDeleteLoading(username)
    try {
      const res = await fetch("/api/auth/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(users.filter(u => u.username !== username))
      } else {
        alert(data.error || "Failed to delete user")
      }
    } catch (err) {
      alert("Failed to delete user")
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError("")
    setAddSuccess("")
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: addForm.username,
          password: addForm.password,
          fullName: addForm.full_name,
          role: addForm.role,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAddSuccess("User added successfully!")
        setAddForm({ username: "", password: "", full_name: "", role: "user" })
        fetchUsers()
      } else {
        setAddError(data.error || "Failed to add user")
      }
    } catch (err) {
      setAddError("Failed to add user")
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Add User Form */}
      <form onSubmit={handleAddUser} className="bg-blue-50 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-end shadow">
        <div className="flex-1">
          <Input
            placeholder="Username"
            value={addForm.username}
            onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))}
            required
            minLength={3}
            disabled={addLoading}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Full Name"
            value={addForm.full_name}
            onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
            required
            disabled={addLoading}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Password"
            type="password"
            value={addForm.password}
            onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
            required
            minLength={6}
            disabled={addLoading}
          />
        </div>
        <div className="w-32">
          <Select value={addForm.role} onValueChange={role => setAddForm(f => ({ ...f, role }))} disabled={addLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={addLoading} className="flex gap-2">
          {addLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          Add User
        </Button>
      </form>
      {addError && <div className="text-red-600 text-center">{addError}</div>}
      {addSuccess && <div className="text-green-600 text-center">{addSuccess}</div>}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg shadow bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-100">
            <tr>
              <th className="p-3 text-left font-semibold">Username</th>
              <th className="p-3 text-left font-semibold">Full Name</th>
              <th className="p-3 text-left font-semibold">Role</th>
              <th className="p-3 text-left font-semibold">Created</th>
              <th className="p-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center text-red-600 py-8">{error}</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8">No users found.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.username} className="border-b last:border-none hover:bg-blue-50 transition">
                  <td className="p-3 font-mono">{user.username}</td>
                  <td className="p-3">{user.full_name}</td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="p-3 text-center">
                    {user.username !== currentUsername && user.username !== "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.username)}
                        disabled={deleteLoading === user.username}
                        className="flex gap-2"
                      >
                        {deleteLoading === user.username ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 