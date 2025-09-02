import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Shield, Users } from "lucide-react";

const Login = () => {
  const [loginType, setLoginType] = useState<"employee" | "super-user">("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === "super-user") {
      // Super User login with email
      if (email && password) {
        localStorage.setItem("userRole", "super-user");
        localStorage.setItem("userEmail", email);
        navigate("/dashboard");
      }
    } else {
      // Employee login with Employee ID
      if (employeeId && password && role) {
        localStorage.setItem("userRole", role);
        localStorage.setItem("employeeId", employeeId);
        navigate("/dashboard");
      }
    }
  };

  const roles = [
    { value: "team-member", label: "Team Member", icon: Users },
    { value: "sme", label: "SME", icon: Shield },
    { value: "admin", label: "Admin", icon: Shield },
    { value: "super-user", label: "Super User", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light mb-4 shadow-medium">
            <Clock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Timesheet Tracker</h1>
          <p className="text-foreground-muted">Professional time tracking and task management</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-strong border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Login Type Selection */}
              <div className="flex gap-2 p-1 bg-surface rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setLoginType("employee")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    loginType === "employee"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Employee Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType("super-user")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    loginType === "super-user"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Super User
                </button>
              </div>

              {loginType === "super-user" ? (
                // Super User Login Form
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-surface border-border focus:border-primary-glow"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-surface border-border focus:border-primary-glow"
                    />
                  </div>
                </>
              ) : (
                // Employee Login Form
                <>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      type="text"
                      placeholder="EMP001234"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                      className="bg-surface border-border focus:border-primary-glow"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-surface border-border focus:border-primary-glow"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger className="bg-surface border-border focus:border-primary-glow">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface border-border">
                        {roles.filter(r => r.value !== "super-user").map((roleOption) => (
                          <SelectItem key={roleOption.value} value={roleOption.value}>
                            <div className="flex items-center gap-2">
                              <roleOption.icon className="w-4 h-4" />
                              {roleOption.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary-glow shadow-soft transition-all duration-300"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-foreground-subtle">
            Secure enterprise timesheet management system
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;