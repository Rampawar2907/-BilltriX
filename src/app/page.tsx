"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Phone, ArrowRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { business } = useStore();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setStep(2);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === "123456") { // Simulated OTP
      if (business && business.name) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2 tracking-tight">BilltriX</h1>
        <p className="text-muted-foreground font-body">Smart GST Invoicing & Ledger Management</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            {step === 1 ? <Phone className="w-6 h-6 text-accent" /> : <ShieldCheck className="w-6 h-6 text-accent" />}
            {step === 1 ? "Sign In / Sign Up" : "Verify OTP"}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? "Enter your mobile number to get started" 
              : "Enter the 6-digit OTP sent to your phone (Use 123456)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center px-3 rounded-md bg-muted text-muted-foreground border border-input">+91</span>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="9876543210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="text-center tracking-widest text-lg font-bold"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Verify & Login
              </Button>
              <Button 
                variant="link" 
                type="button"
                className="w-full text-sm" 
                onClick={() => setStep(1)}
              >
                Change Number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
