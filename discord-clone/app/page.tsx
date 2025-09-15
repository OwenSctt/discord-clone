"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const { login, register, user, loading } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/app")
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      if (isLogin) {
        await login(email, password)
        router.push("/app")
      } else {
        await register(username, displayName, email, password)
        router.push("/app")
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#404eed] via-[#5865f2] to-[#7289da] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#404eed] via-[#5865f2] to-[#7289da] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-20 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-40 w-32 h-32 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Discord Logo */}
      <div className="absolute top-8 left-8 flex items-center gap-2 text-white bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg">
        <svg width="32" height="24" viewBox="0 0 71 55" fill="none">
          <g clipPath="url(#clip0)">
            <path
              d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
              fill="currentColor"
            />
          </g>
        </svg>
        <span className="text-xl font-bold">Discord</span>
      </div>

      {/* Main login form */}
      <div className="bg-[#36393f] rounded-lg p-8 w-full max-w-md shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{isLogin ? "Welcome back!" : "Create an account"}</h1>
          <p className="text-[#b9bbbe] text-sm">
            {isLogin ? "We're so excited to see you again!" : "We're excited to see you join our community!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="username" className="text-[#b9bbbe] text-xs font-bold uppercase tracking-wide">
                  Username *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 bg-[#202225] border-none text-white placeholder-[#72767d] focus:ring-2 focus:ring-[#5865f2] h-10"
                  required={!isLogin}
                />
              </div>
              <div>
                <Label htmlFor="displayName" className="text-[#b9bbbe] text-xs font-bold uppercase tracking-wide">
                  Display Name *
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 bg-[#202225] border-none text-white placeholder-[#72767d] focus:ring-2 focus:ring-[#5865f2] h-10"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-[#b9bbbe] text-xs font-bold uppercase tracking-wide">
              Email or Phone Number *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 bg-[#202225] border-none text-white placeholder-[#72767d] focus:ring-2 focus:ring-[#5865f2] h-10"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#b9bbbe] text-xs font-bold uppercase tracking-wide">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 bg-[#202225] border-none text-white placeholder-[#72767d] focus:ring-2 focus:ring-[#5865f2] h-10"
              required
            />
          </div>

          {isLogin && (
            <div className="text-left">
              <Link href="#" className="text-[#00aff4] text-sm hover:underline">
                Forgot your password?
              </Link>
            </div>
          )}

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded text-sm">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium h-11 rounded-sm"
          >
            {isSubmitting ? "Please wait..." : (isLogin ? "Log In" : "Continue")}
          </Button>

          <div className="text-sm text-[#72767d]">
            {isLogin ? "Need an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[#00aff4] hover:underline">
              {isLogin ? "Register" : "Log In"}
            </button>
          </div>
        </form>

        {isLogin && (
          <div className="mt-6 pt-6 border-t border-[#4f545c]">
            <div className="text-center">
              <h3 className="text-white font-medium mb-4">Log in with QR Code</h3>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <div className="w-32 h-32 bg-black flex items-center justify-center text-white text-xs">QR Code</div>
              </div>
              <p className="text-[#b9bbbe] text-sm">
                Scan this with the <strong>Discord mobile app</strong> to log in instantly.
              </p>
              <Link href="#" className="text-[#00aff4] text-sm hover:underline block mt-2">
                Or, sign in with passkey
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
