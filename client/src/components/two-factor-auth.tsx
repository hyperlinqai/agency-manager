import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, Smartphone, ExternalLink, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function TwoFactorAuth() {
  const { toast } = useToast();
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/auth/2fa/status"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ qrCode: string; secret: string; manualEntryKey: string }>(
        "POST",
        "/api/auth/2fa/generate"
      );
    },
    onSuccess: (data) => {
      setQrCodeData({ qrCode: data.qrCode, secret: data.manualEntryKey });
      setShowQRCode(true);
      toast({
        title: "QR Code Generated",
        description: "Scan the QR code with your authenticator app",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/auth/2fa/verify", { code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/2fa/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowQRCode(false);
      setVerificationCode("");
      setQrCodeData(null);
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async ({ password, code }: { password: string; code?: string }) => {
      return apiRequest("POST", "/api/auth/2fa/disable", { password, code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/2fa/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowDisableDialog(false);
      setDisablePassword("");
      setDisableCode("");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopySecret = () => {
    if (qrCodeData?.secret) {
      navigator.clipboard.writeText(qrCodeData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard",
      });
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Secure your account with an extra layer of protection</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isEnabled = status?.enabled || false;

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription className="mt-1">
                  Add an extra layer of security to your account using authenticator apps like Google Authenticator
                </CardDescription>
              </div>
              {isEnabled && (
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Enabled
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEnabled ? (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>2FA is active!</strong> Your account is protected. You'll need to enter a code from your authenticator app when logging in.
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                  className="w-full sm:w-auto"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is not enabled. Enable it now to significantly improve your account security.
                  </AlertDescription>
                </Alert>

                {/* Authenticator App Recommendations */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Recommended Authenticator Apps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <a
                        href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">Google Authenticator</p>
                          <p className="text-xs text-muted-foreground">Free • Popular</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <a
                        href="https://authy.com/download/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">Authy</p>
                          <p className="text-xs text-muted-foreground">Free • Cloud Backup</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <a
                        href="https://www.microsoft.com/en-us/security/mobile-authenticator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">Microsoft Authenticator</p>
                          <p className="text-xs text-muted-foreground">Free • Secure</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating QR Code...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Set Up 2FA with Authenticator App
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Follow these steps to enable 2FA using your authenticator app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {qrCodeData && (
              <>
                {/* Step-by-step Instructions */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      1
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">Install an Authenticator App</p>
                      <p className="text-sm text-muted-foreground">
                        If you haven't already, download and install Google Authenticator, Authy, Microsoft Authenticator, or any TOTP-compatible app on your phone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      2
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">Scan the QR Code</p>
                      <p className="text-sm text-muted-foreground">
                        Open your authenticator app and scan this QR code, or enter the manual key below.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      3
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">Enter Verification Code</p>
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code from your authenticator app to complete the setup.
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Scan QR Code</Label>
                  <div className="flex justify-center p-6 bg-muted rounded-lg border-2 border-dashed">
                    <img src={qrCodeData.qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Point your phone's camera at the QR code. Your authenticator app will automatically add this account.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Manual Entry */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Can't Scan? Enter Manually</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={qrCodeData.secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                      className="shrink-0"
                      title="Copy secret key"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If you can't scan the QR code, copy this key and enter it manually in your authenticator app under "Enter a setup key"
                  </p>
                </div>

                {/* Verification Code Input */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Enter Verification Code</Label>
                  <Input
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest h-16"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code displayed in your authenticator app to verify and enable 2FA
                  </p>
                </div>

                {/* Security Tips */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs">
                    <strong>Security Tip:</strong> Keep your authenticator app secure and don't share your backup codes. 
                    If you lose access to your authenticator app, you'll need to contact support to regain access.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowQRCode(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (verificationCode.length === 6) {
                  verifyMutation.mutate(verificationCode);
                } else {
                  toast({
                    title: "Invalid Code",
                    description: "Please enter a 6-digit verification code from your authenticator app",
                    variant: "destructive",
                  });
                }
              }}
              disabled={verificationCode.length !== 6 || verifyMutation.isPending}
              className="min-w-[140px]"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify & Enable
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              To disable 2FA, please enter your password and a code from your authenticator app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>2FA Code</Label>
              <Input
                placeholder="Enter 6-digit code from your app"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!disablePassword) {
                  toast({
                    title: "Password Required",
                    description: "Please enter your password",
                    variant: "destructive",
                  });
                  return;
                }
                disableMutation.mutate({
                  password: disablePassword,
                  code: disableCode || undefined,
                });
              }}
              disabled={disableMutation.isPending || !disablePassword}
            >
              {disableMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

