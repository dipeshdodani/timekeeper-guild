import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Search, Edit, Trash2, Users, Upload, Download, Save, X, ToggleLeft, ToggleRight, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BulkUpload from "@/components/BulkUpload";
import PasswordResetModal from "@/components/PasswordResetModal";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
  team: string;
  is_active: boolean;
  join_date: string;
  last_active: string;
  password_hash: string;
}

const TeamManagement = () => {
  const [userRole, setUserRole] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState<{
    employee_id: string;
    full_name: string;
    role: string;
    team: string;
    password: string;
  }>({
    employee_id: "",
    full_name: "",
    role: "team-member",
    team: "",
    password: ""
  });
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Employee>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployeeForPassword, setSelectedEmployeeForPassword] = useState<Employee | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || (role !== "admin" && role !== "super-user")) {
      navigate("/dashboard");
      return;
    }
    setUserRole(role);
    loadEmployees();
  }, [navigate]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading employees:', error);
        toast({
          title: "Error",
          description: "Failed to load employees",
          variant: "destructive"
        });
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error", 
        description: "Failed to load employees",
        variant: "destructive"
      });
    }
  };

  const teams = ["Support", "CI", "Migration", "Config", "Exxat One"];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || employee.role === filterRole;
    const matchesTeam = filterTeam === "all" || employee.team === filterTeam;
    return matchesSearch && matchesRole && matchesTeam;
  });

  const handleAddEmployee = async () => {
    if (!newEmployee.employee_id || !newEmployee.full_name || !newEmployee.team || !newEmployee.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate employee ID
    if (employees.some(emp => emp.employee_id === newEmployee.employee_id)) {
      toast({
        title: "Error", 
        description: "Employee ID already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_id: newEmployee.employee_id,
          full_name: newEmployee.full_name,
          role: newEmployee.role,
          team: newEmployee.team,
          password_hash: newEmployee.password,
          is_active: true,
          join_date: new Date().toISOString().split('T')[0],
          last_active: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add employee",
          variant: "destructive"
        });
        return;
      }

      setEmployees(prev => [...prev, data]);
      setNewEmployee({
        employee_id: "",
        full_name: "",
        role: "team-member",
        team: "",
        password: ""
      });
      setIsAddingEmployee(false);
      
      toast({
        title: "Success",
        description: "Employee added successfully"
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive"
      });
    }
  };

  const toggleEmployeeStatus = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employeeId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update employee status",
          variant: "destructive"
        });
        return;
      }

      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, is_active: !emp.is_active }
          : emp
      ));

      toast({
        title: "Success",
        description: "Employee status updated"
      });
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive"
      });
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete employee",
          variant: "destructive"
        });
        return;
      }

      setEmployees(prev => prev.filter(employee => employee.id !== employeeId));
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
      toast({
        title: "Employee Removed",
        description: "Employee has been removed successfully"
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee.id);
    setEditingData({ ...employee });
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee || !editingData) return;

    // Validation
    if (!editingData.full_name || !editingData.team) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate employee ID if changed
    if (editingData.employee_id && 
        employees.some(emp => emp.id !== editingEmployee && emp.employee_id === editingData.employee_id)) {
      toast({
        title: "Error",
        description: "Employee ID already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .update(editingData)
        .eq('id', editingEmployee);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update employee",
          variant: "destructive"
        });
        return;
      }

      setEmployees(prev => prev.map(employee => 
        employee.id === editingEmployee 
          ? { ...employee, ...editingData }
          : employee
      ));

      setEditingEmployee(null);
      setEditingData({});
      toast({
        title: "Success",
        description: "Employee updated successfully"
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditingData({});
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleAllEmployees = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .in('id', selectedEmployees);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete employees",
          variant: "destructive"
        });
        return;
      }

      setEmployees(prev => prev.filter(employee => !selectedEmployees.includes(employee.id)));
      setSelectedEmployees([]);
      toast({
        title: "Employees Removed",
        description: `${selectedEmployees.length} employees have been removed successfully`
      });
    } catch (error) {
      console.error('Error deleting employees:', error);
      toast({
        title: "Error",
        description: "Failed to delete employees",
        variant: "destructive"
      });
    }
  };

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const handleBulkUploadData = async (data: Record<string, string>[]): Promise<any> => {
    const successful: Employee[] = [];
    const errors: any[] = [];

    try {
      const employeesToInsert = data.map((row, index) => ({
        employee_id: row["Employee ID"] || "",
        full_name: row["Name"] || "",
        role: row["Role"] || "team-member",
        team: row["Team"] || "",
        password_hash: row["Password"] || "",
        is_active: true,
        join_date: new Date().toISOString().split('T')[0],
        last_active: new Date().toISOString().split('T')[0]
      }));

      const { data: insertedEmployees, error } = await supabase
        .from('employees')
        .insert(employeesToInsert)
        .select();

      if (error) {
        console.error('Bulk upload error:', error);
        return {
          successful: 0,
          failed: data.length,
          errors: [{ row: 1, error: error.message }]
        };
      }

      // Refresh the employees list
      await loadEmployees();
      
      return {
        successful: insertedEmployees?.length || 0,
        failed: 0,
        errors: []
      };
    } catch (error) {
      console.error('Bulk upload error:', error);
      return {
        successful: 0,
        failed: data.length,
        errors: [{ row: 1, error: "Database error occurred" }]
      };
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ["Employee ID", "Name", "Role", "Team", "Status", "Join Date", "Last Active"],
      ...employees.map(emp => [
        emp.employee_id, emp.full_name, emp.role, emp.team, emp.is_active ? "active" : "inactive", emp.join_date, emp.last_active
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_members.csv';
    a.click();
    
    toast({
      title: "Export Complete",
      description: "Team data exported successfully"
    });
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      "team-member": "secondary",
      "sme": "default",
      "admin": "destructive"
    };
    return variants[role as keyof typeof variants] || "default";
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      "team-member": "Team Member",
      "sme": "SME", 
      "admin": "Admin"
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const handlePasswordReset = async (employeeId: string, newPassword: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ password_hash: newPassword })
        .eq('id', employeeId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update password",
          variant: "destructive"
        });
        return;
      }

      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, password_hash: newPassword }
          : emp
      ));

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
    }
  };

  const openPasswordModal = (employee: Employee) => {
    setSelectedEmployeeForPassword(employee);
    setShowPasswordModal(true);
  };

  const bulkUploadValidation = {
    "Employee ID": (value: string) => 
      employees.some(emp => emp.employee_id === value) ? "Employee ID already exists" : null,
    "Role": (value: string) => !["team-member", "sme", "admin"].includes(value) ? "Role must be team-member, sme, or admin" : null,
    "Team": (value: string) => !teams.includes(value) ? `Team must be one of: ${teams.join(", ")}` : null,
    "Password": (value: string) => {
      if (value.length < 8) {
        return "Password must be at least 8 characters long";
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
        return "Password must contain uppercase, lowercase, number, and special character";
      }
      return null;
    }
  };

  const sampleData = [
    {
      "Employee ID": "EMP006",
      "Name": "John Doe",
      "Role": "team-member",
      "Team": "Support",
      "Password": "tempPassword123"
    }
  ];

  if (showBulkUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
        <BulkUpload
          title="Bulk Upload Team Members"
          templateColumns={["Employee ID", "Name", "Role", "Team", "Password"]}
          sampleData={sampleData}
          onUpload={handleBulkUploadData}
          onClose={() => setShowBulkUpload(false)}
          validationRules={bulkUploadValidation}
          formatInfo={{
            description: "Upload team members with their login credentials. All fields are required.",
            requirements: [
              "Unique Employee ID for each member", 
              "Password must be at least 8 characters",
              "Password must contain uppercase, lowercase, number, and special character"
            ],
            validValues: {
              'Role': ['team-member', 'sme', 'admin'],
              'Team': teams
            },
            example: {
              'Employee ID': 'EMP006',
              'Name': 'Alex Johnson', 
              'Role': 'team-member',
              'Team': 'Support',
              'Password': 'SecurePass123!'
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="bg-surface border-border hover:bg-surface-elevated"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-foreground-muted">Manage team members and their assignments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddingEmployee(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
            {userRole === "super-user" && (
              <>
                <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                {selectedEmployees.length > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedEmployees.length})
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{employees.length}</div>
              <div className="text-sm text-foreground-muted">Total Employees</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-success">{employees.filter(e => e.is_active).length}</div>
              <div className="text-sm text-foreground-muted">Active</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-warning">{teams.length}</div>
              <div className="text-sm text-foreground-muted">Teams</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{employees.filter(e => e.role === "admin").length}</div>
              <div className="text-sm text-foreground-muted">Admins</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface border-border"
              />
            </div>
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48 bg-surface border-border">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="team-member">Team Member</SelectItem>
              <SelectItem value="sme">SME</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48 bg-surface border-border">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Employee Form */}
        {isAddingEmployee && (
          <Card className="mb-6 shadow-medium border-border">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
              <CardDescription>Add a new team member to the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={newEmployee.employee_id}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="EMP001"
                    className="bg-surface border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="John Doe"
                    className="bg-surface border-border"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="bg-surface border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={newEmployee.role} 
                    onValueChange={(value: "team-member" | "sme" | "admin") => setNewEmployee(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="bg-surface border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border z-50">
                      <SelectItem value="team-member">Team Member</SelectItem>
                      <SelectItem value="sme">SME</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team">Team *</Label>
                  <Select 
                    value={newEmployee.team} 
                    onValueChange={(value) => setNewEmployee(prev => ({ ...prev, team: value }))}
                  >
                    <SelectTrigger className="bg-surface border-border">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface border-border z-50">
                      {teams.map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddEmployee}>Add Employee</Button>
                <Button variant="outline" onClick={() => setIsAddingEmployee(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employees Table */}
        <Card className="shadow-soft border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onCheckedChange={toggleAllEmployees}
                  />
                </TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingEmployee === employee.id ? (
                      <Input
                        value={editingData.employee_id || ""}
                        onChange={(e) => setEditingData(prev => ({ ...prev, employee_id: e.target.value }))}
                        className="w-24"
                      />
                    ) : (
                      employee.employee_id
                    )}
                  </TableCell>
                   <TableCell>
                     {editingEmployee === employee.id ? (
                        <Input
                          value={editingData.full_name || ""}
                          onChange={(e) => setEditingData(prev => ({ ...prev, full_name: e.target.value }))}
                          className="w-32"
                        />
                     ) : (
                       employee.full_name
                     )}
                   </TableCell>
                  <TableCell>
                    {editingEmployee === employee.id ? (
                      <Select 
                        value={editingData.role || employee.role} 
                        onValueChange={(value: "team-member" | "sme" | "admin") => setEditingData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-border z-50">
                          <SelectItem value="team-member">Team Member</SelectItem>
                          <SelectItem value="sme">SME</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadge(employee.role) as any}>
                        {getRoleDisplayName(employee.role)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEmployee === employee.id ? (
                      <Select 
                        value={editingData.team || employee.team} 
                        onValueChange={(value) => setEditingData(prev => ({ ...prev, team: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-surface border-border z-50">
                          {teams.map(team => (
                            <SelectItem key={team} value={team}>{team}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      employee.team
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.join_date}</TableCell>
                  <TableCell>{employee.last_active}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {editingEmployee === employee.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveEmployee}
                            className="w-8 h-8 hover:bg-success/10 hover:text-success"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            className="w-8 h-8 hover:bg-muted"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                       ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEmployee(employee)}
                            className="w-8 h-8"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPasswordModal(employee)}
                            className="w-8 h-8"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleEmployeeStatus(employee.id)}
                            className="w-8 h-8"
                            title="Toggle Status"
                          >
                            {employee.is_active ? (
                              <ToggleRight className="w-4 h-4 text-success" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEmployee(employee.id)}
                            className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {filteredEmployees.length === 0 && (
          <Card className="p-8 text-center shadow-soft border-border">
            <Users className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Employees Found</h3>
            <p className="text-foreground-muted">
              {searchTerm || filterRole !== "all" || filterTeam !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first team member"
              }
            </p>
          </Card>
        )}

        <PasswordResetModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          employee={selectedEmployeeForPassword}
          onPasswordReset={handlePasswordReset}
        />
      </div>
    </div>
  );
};

export default TeamManagement;