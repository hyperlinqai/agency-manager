import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password, twoFactorCode || undefined);
      
      if (result?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setIsLoading(false);
        toast({
          title: "2FA Required",
          description: "Please enter the code from your authenticator app",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to Agency Manager",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      setIsLoading(false);
      setRequiresTwoFactor(false);
    }
  };

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg shadow-primary/25">
                <img src="/logo.svg" alt="Agency Manager" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Agency Manager</h1>
                <p className="text-sm text-slate-400">by Hyperlinq Technology</p>
              </div>
            </div>
            
            {/* Tagline */}
            <div className="space-y-4 max-w-md">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
                Manage your business with confidence
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                A complete CRM solution for managing clients, invoices, expenses, and your team all in one place.
              </p>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                "Client Management",
                "Invoice Generation",
                "Expense Tracking",
                "Team & Payroll",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg shadow-primary/25">
                <img src="/logo.svg" alt="Agency Manager" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Agency Manager</h1>
                <p className="text-xs text-muted-foreground">by Hyperlinq Technology</p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 px-4 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all"
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={requiresTwoFactor}
                  className="h-11 px-4 pr-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={requiresTwoFactor}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {requiresTwoFactor && (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Two-Factor Authentication Code
                </Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  className="h-11 px-4 text-center text-lg font-mono tracking-widest bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all"
                  data-testid="input-2fa-code"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-semibold shadow-lg shadow-primary/25 transition-all duration-200"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
