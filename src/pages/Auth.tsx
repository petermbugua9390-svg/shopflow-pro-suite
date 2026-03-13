import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Loader2, ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthView = "login" | "signup" | "verify-signup" | "forgot-password" | "verify-reset" | "new-password";

export default function Auth() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) throw error;
      toast.success("OTP sent to your email. Please check your inbox.");
      setView("verify-signup");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });
      if (error) throw error;
      toast.success("Email verified! You're now signed in.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Password reset OTP sent to your email.");
      setView("verify-reset");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });
      if (error) throw error;
      toast.success("OTP verified! Set your new password.");
      setOtp("");
      setView("new-password");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated! You're now signed in.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetToLogin = () => {
    setView("login");
    setOtp("");
    setNewPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            {view === "verify-signup" || view === "verify-reset" ? (
              <ShieldCheck className="h-7 w-7 text-primary-foreground" />
            ) : view === "forgot-password" ? (
              <KeyRound className="h-7 w-7 text-primary-foreground" />
            ) : view === "new-password" ? (
              <KeyRound className="h-7 w-7 text-primary-foreground" />
            ) : (
              <ShoppingCart className="h-7 w-7 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {view === "login" && "RetailPro"}
            {view === "signup" && "Create Account"}
            {view === "verify-signup" && "Verify Email"}
            {view === "forgot-password" && "Reset Password"}
            {view === "verify-reset" && "Verify OTP"}
            {view === "new-password" && "New Password"}
          </CardTitle>
          <CardDescription>
            {view === "login" && "Sign in to your account"}
            {view === "signup" && "Get started with RetailPro"}
            {view === "verify-signup" && (
              <>We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span></>
            )}
            {view === "forgot-password" && "Enter your email to receive a reset code"}
            {view === "verify-reset" && (
              <>Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span></>
            )}
            {view === "new-password" && "Choose a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* LOGIN */}
          {view === "login" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@retailpro.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" onClick={() => setView("forgot-password")} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign In
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView("signup")} className="text-sm text-primary hover:underline">
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP */}
          {view === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sarah Kim" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupEmail">Email</Label>
                <Input id="signupEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@retailpro.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signupPassword">Password</Label>
                <Input id="signupPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Account
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setView("login")} className="text-sm text-primary hover:underline">
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* VERIFY SIGNUP OTP */}
          {view === "verify-signup" && (
            <form onSubmit={handleVerifySignup} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || otp.length < 6}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify & Sign In
              </Button>
              <div className="text-center space-y-2">
                <button type="button" onClick={resetToLogin} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {view === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input id="resetEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@retailpro.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Mail className="h-4 w-4 mr-2" />
                Send Reset Code
              </Button>
              <div className="text-center">
                <button type="button" onClick={resetToLogin} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* VERIFY RESET OTP */}
          {view === "verify-reset" && (
            <form onSubmit={handleVerifyReset} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || otp.length < 6}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Verify Code
              </Button>
              <div className="text-center">
                <button type="button" onClick={resetToLogin} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
              </div>
            </form>
          )}

          {/* NEW PASSWORD */}
          {view === "new-password" && (
            <form onSubmit={handleNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
