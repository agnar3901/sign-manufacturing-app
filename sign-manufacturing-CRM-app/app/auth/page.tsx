"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  const handleLoginSuccess = (user: any) => {
    // Store user data in localStorage or session
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("isAuthenticated", "true")
    
    // Redirect based on role
    if (user.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
  }

  const handleSignupSuccess = (user: any) => {
    // Store user data in localStorage or session
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("isAuthenticated", "true")
    
    // Redirect based on role
    if (user.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rangaa Digitals</h1>
          <p className="text-lg text-gray-600">It's a Creative Edge</p>
          <p className="text-base text-gray-500">Professional Sign Design & Manufacturing Management</p>
        </div>
        
        {isLogin ? (
          <LoginForm 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm 
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  )
} 