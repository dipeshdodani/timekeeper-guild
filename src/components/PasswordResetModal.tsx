import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'team-member' | 'sme' | 'admin';
  team: string;
  status: 'active' | 'inactive';
  joinDate: string;
  lastActive: string;
  password?: string;
}

interface PasswordResetModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onPasswordReset: (employeeId: string, newPassword: string) => void;
}

const PasswordResetModal = ({ open, onClose, employee, onPasswordReset }: PasswordResetModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateSecurePassword = () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '@$!%*?&';
      
      let password = '';
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += special[Math.floor(Math.random() * special.length)];
      
      const allChars = uppercase + lowercase + numbers + special;
      for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle password
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      setNewPassword(password);
      setIsGenerating(false);
    }, 500);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength += 20;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) strength += 20;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) strength += 20;
    else feedback.push('Uppercase letter');
    
    if (/\d/.test(password)) strength += 20;
    else feedback.push('Number');
    
    if (/[@$!%*?&]/.test(password)) strength += 20;
    else feedback.push('Special character (@$!%*?&)');
    
    return { strength, feedback };
  };

  const handleReset = () => {
    if (!employee || !newPassword) return;
    
    const { strength } = getPasswordStrength(newPassword);
    if (strength < 100) {
      toast({
        title: "Weak Password",
        description: "Please ensure password meets all requirements",
        variant: "destructive"
      });
      return;
    }
    
    onPasswordReset(employee.id, newPassword);
    setNewPassword('');
    onClose();
    
    toast({
      title: "Password Reset",
      description: `Password updated for ${employee.name}`,
    });
  };

  const handleClose = () => {
    setNewPassword('');
    setShowPassword(false);
    onClose();
  };

  if (!employee) return null;

  const { strength, feedback } = getPasswordStrength(newPassword);
  const isValidPassword = strength === 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">{employee.name}</p>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
            <p className="text-sm text-muted-foreground">ID: {employee.employeeId}</p>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={generateSecurePassword}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Password Strength */}
          {newPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Password Strength</span>
                <span className={`font-medium ${
                  strength < 40 ? 'text-destructive' : 
                  strength < 80 ? 'text-orange-500' : 'text-green-500'
                }`}>
                  {strength < 40 ? 'Weak' : strength < 80 ? 'Medium' : 'Strong'}
                </span>
              </div>
              <Progress value={strength} className="h-2" />
              
              {feedback.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Missing: {feedback.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              
              {isValidPassword && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Password meets all security requirements
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Security Notice */}
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              The employee will need to use this new password for their next login.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleReset}
              disabled={!isValidPassword}
              className="bg-primary hover:bg-primary/90"
            >
              Reset Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetModal;