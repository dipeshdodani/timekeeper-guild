import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Search, Edit, Trash2, Users, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BulkUpload from "@/components/BulkUpload";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: "team-member" | "sme" | "admin";
  team: string;
  status: "active" | "inactive";
  joinDate: string;
  lastActive: string;
}

const TeamManagement = () => {
  const [userRole, setUserRole] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState<{
    employeeId: string;
    name: string;
    email: string;
    role: "team-member" | "sme" | "admin";
    team: string;
    password: string;
  }>({
    employeeId: "",
    name: "",
    email: "",
    role: "team-member",
    team: "",
    password: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || (role !== "admin" && role !== "super-user")) {
      navigate("/dashboard");
      return;
    }
    setUserRole(role);
    
    // Load sample employees
    const sampleEmployees: Employee[] = [
      {
        id: "1",
        employeeId: "EMP001",
        name: "John Smith",
        email: "john.smith@company.com",
        role: "team-member",
        team: "Support",
        status: "active",
        joinDate: "2024-01-15",
        lastActive: "2024-01-20"
      },
      {
        id: "2",
        employeeId: "EMP002", 
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        role: "sme",
        team: "CI",
        status: "active",
        joinDate: "2023-12-10",
        lastActive: "2024-01-19"
      },
      {
        id: "3",
        employeeId: "EMP003",
        name: "Mike Wilson",
        email: "mike.wilson@company.com", 
        role: "admin",
        team: "Migration",
        status: "active",
        joinDate: "2023-11-01",
        lastActive: "2024-01-20"
      },
      {
        id: "4",
        employeeId: "EMP004",
        name: "Lisa Chen",
        email: "lisa.chen@company.com",
        role: "team-member",
        team: "Config", 
        status: "inactive",
        joinDate: "2024-01-05",
        lastActive: "2024-01-18"
      },
      {
        id: "5",
        employeeId: "EMP005",
        name: "David Brown",
        email: "david.brown@company.com",
        role: "sme",
        team: "Exxat One",
        status: "active",
        joinDate: "2024-01-12",
        lastActive: "2024-01-20"
      }
    ];
    setEmployees(sampleEmployees);
  }, [navigate]);

  const teams = ["Support", "CI", "Migration", "Config", "Exxat One"];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || employee.role === filterRole;
    const matchesTeam = filterTeam === "all" || employee.team === filterTeam;
    return matchesSearch && matchesRole && matchesTeam;
  });

  const handleAddEmployee = () => {
    if (!newEmployee.employeeId || !newEmployee.name || !newEmployee.email || !newEmployee.team || !newEmployee.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate employee ID
    if (employees.some(emp => emp.employeeId === newEmployee.employeeId)) {
      toast({
        title: "Error", 
        description: "Employee ID already exists",
        variant: "destructive"
      });
      return;
    }

    const employee: Employee = {
      id: Date.now().toString(),
      ...newEmployee,
      status: "active",
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0]
    };

    setEmployees(prev => [...prev, employee]);
    setNewEmployee({
      employeeId: "",
      name: "",
      email: "",
      role: "team-member",
      team: "",
      password: ""
    });
    setIsAddingEmployee(false);
    
    toast({
      title: "Success",
      description: "Employee added successfully"
    });
  };

  const toggleEmployeeStatus = (employeeId: string) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === employeeId 
        ? { ...employee, status: employee.status === "active" ? "inactive" : "active" }
        : employee
    ));
  };

  const deleteEmployee = (employeeId: string) => {
    setEmployees(prev => prev.filter(employee => employee.id !== employeeId));
    toast({
      title: "Employee Removed",
      description: "Employee has been removed successfully"
    });
  };

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const handleBulkUploadData = async (data: Record<string, string>[]): Promise<any> => {
    const successful: Employee[] = [];
    const errors: any[] = [];

    data.forEach((row, index) => {
      try {
        const employee: Employee = {
          id: Date.now().toString() + index,
          employeeId: row["Employee ID"] || "",
          name: row["Name"] || "",
          email: row["Email"] || "",
          role: (row["Role"] as "team-member" | "sme" | "admin") || "team-member",
          team: row["Team"] || "",
          status: "active",
          joinDate: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString().split('T')[0]
        };
        successful.push(employee);
      } catch (error) {
        errors.push({ row: index + 1, error: "Invalid data format" });
      }
    });

    setEmployees(prev => [...prev, ...successful]);
    
    return {
      successful: successful.length,
      failed: errors.length,
      errors
    };
  };

  const handleExportData = () => {
    const csvContent = [
      ["Employee ID", "Name", "Email", "Role", "Team", "Status", "Join Date", "Last Active"],
      ...employees.map(emp => [
        emp.employeeId, emp.name, emp.email, emp.role, emp.team, emp.status, emp.joinDate, emp.lastActive
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

  const bulkUploadValidation = {
    "Employee ID": (value: string) => 
      employees.some(emp => emp.employeeId === value) ? "Employee ID already exists" : null,
    "Email": (value: string) => !value.includes("@") ? "Invalid email format" : null,
    "Role": (value: string) => !["team-member", "sme", "admin"].includes(value) ? "Role must be team-member, sme, or admin" : null,
    "Team": (value: string) => !teams.includes(value) ? `Team must be one of: ${teams.join(", ")}` : null
  };

  const sampleData = [
    {
      "Employee ID": "EMP006",
      "Name": "John Doe",
      "Email": "john.doe@company.com",
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
          templateColumns={["Employee ID", "Name", "Email", "Role", "Team", "Password"]}
          sampleData={sampleData}
          onUpload={handleBulkUploadData}
          onClose={() => setShowBulkUpload(false)}
          validationRules={bulkUploadValidation}
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
              </>
            )}
            <Button onClick={() => setIsAddingEmployee(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
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
              <div className="text-2xl font-bold text-success">{employees.filter(e => e.status === "active").length}</div>
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
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="EMP001"
                    className="bg-surface border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="bg-surface border-border"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@company.com"
                    className="bg-surface border-border"
                  />
                </div>
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

        {/* Employees List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="shadow-soft border-border hover:shadow-medium transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {employee.name}
                    </CardTitle>
                    <p className="text-sm text-foreground-muted">{employee.employeeId}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getRoleBadge(employee.role) as any}>
                        {getRoleDisplayName(employee.role)}
                      </Badge>
                      <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleEmployeeStatus(employee.id)}
                      className="w-8 h-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEmployee(employee.id)}
                      className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-foreground-muted">Email: </span>
                    <span className="text-foreground">{employee.email}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Team: </span>
                    <span className="text-foreground">{employee.team}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Joined: </span>
                    <span className="text-foreground">{employee.joinDate}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Last Active: </span>
                    <span className="text-foreground">{employee.lastActive}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
      </div>
    </div>
  );
};

export default TeamManagement;