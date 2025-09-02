import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Shield, Users } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && role) {
      // Store user role in localStorage for demo
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", email);
      navigate("/dashboard");
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
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
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

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger className="bg-surface border-border focus:border-primary-glow">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface border-border">
                    {roles.map((roleOption) => (
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