import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Save, X, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BulkUpload from "@/components/BulkUpload";
import { ColumnManager, ColumnManagerTrigger, ColumnConfig } from "@/components/ColumnManager";

interface Task {
  id: string;
  category: string;
  subCategory: string;
  team: string;
  status: "active" | "inactive";
  type: "direct" | "indirect";
  // Backend-only fields (not displayed in UI)
  description?: string;
  estimatedTime?: number;
  priority?: "low" | "medium" | "high";
  createdBy: string;
  createdAt: string;
}

const Tasks = () => {
  const [userRole, setUserRole] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Task>>({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "category", label: "Category", visible: true },
    { key: "subCategory", label: "Sub Category", visible: true },
    { key: "team", label: "Team", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "type", label: "Type", visible: true },
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);
    
    // Load column preferences from localStorage
    const savedColumns = localStorage.getItem("taskColumns");
    if (savedColumns) {
      setColumns(JSON.parse(savedColumns));
    }
    
    // Load sample tasks with updated categories
    const sampleTasks: Task[] = [
      {
        id: "1",
        category: "Customer Support",
        subCategory: "Phone Support",
        team: "Support",
        status: "active",
        type: "direct",
        // Backend fields
        description: "Handle customer inquiries and provide support",
        estimatedTime: 15,
        priority: "medium",
        createdBy: "admin@company.com",
        createdAt: "2024-01-15"
      },
      {
        id: "2", 
        category: "CI Operations",
        subCategory: "Pipeline Configuration",
        team: "All Teams",
        status: "active",
        type: "indirect",
        // Backend fields
        description: "Set up and maintain continuous integration pipelines",
        estimatedTime: 45,
        priority: "high",
        createdBy: "sme@company.com",
        createdAt: "2024-01-10"
      },
      {
        id: "3",
        category: "Database Management",
        subCategory: "Migration Scripts",
        team: "Migration",
        status: "active",
        type: "direct",
        // Backend fields
        description: "Create and execute database migration procedures",
        estimatedTime: 60,
        priority: "high",
        createdBy: "admin@company.com",
        createdAt: "2024-01-12"
      },
      {
        id: "4",
        category: "System Configuration",
        subCategory: "Environment Setup",
        team: "All Teams",
        status: "active",
        type: "indirect",
        // Backend fields
        description: "Configure system environments and settings",
        estimatedTime: 30,
        priority: "medium",
        createdBy: "sme@company.com",
        createdAt: "2024-01-08"
      },
      {
        id: "5",
        category: "Platform Integration",
        subCategory: "Exxat One",
        team: "Exxat One",
        status: "active",
        type: "direct",
        // Backend fields
        description: "Integrate with Exxat One platform systems",
        estimatedTime: 90,
        priority: "high",
        createdBy: "admin@company.com",
        createdAt: "2024-01-14"
      }
    ];
    setTasks(sampleTasks);
  }, [navigate]);

  const canManageTasks = userRole === "sme" || userRole === "admin" || userRole === "super-user";

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === "all" || task.team === filterTeam || task.team === "All Teams";
    return matchesSearch && matchesTeam;
  });

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      category: "New Category",
      subCategory: "New Sub Category",
      team: "Support",
      status: "active",
      type: "direct",
      // Backend fields
      description: "Task description",
      estimatedTime: 30,
      priority: "medium",
      createdBy: localStorage.getItem("userEmail") || "",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks(prev => [...prev, newTask]);
    setEditingTask(newTask.id);
    setEditingData(newTask);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task.id);
    setEditingData({ ...task });
  };

  const handleSaveTask = () => {
    if (!editingTask || !editingData.category) return;

    setTasks(prev => prev.map(task => 
      task.id === editingTask 
        ? { ...task, ...editingData }
        : task
    ));
    
    setEditingTask(null);
    setEditingData({});
    
    toast({
      title: "Success",
      description: "Task updated successfully"
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditingData({});
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === "active" ? "inactive" : "active" }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Task Deleted",
      description: "Task has been removed successfully"
    });
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0) return;
    
    setTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
    setSelectedTasks([]);
    
    toast({
      title: "Tasks Deleted",
      description: `${selectedTasks.length} tasks have been removed`
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "secondary",
      medium: "default", 
      high: "destructive"
    };
    return variants[priority as keyof typeof variants] || "default";
  };

  const teams = ["Support", "CI", "Migration", "Config", "Exxat One", "All Teams"];
  
  const handleColumnsChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
    localStorage.setItem("taskColumns", JSON.stringify(newColumns));
  };

  const renderCell = (task: Task, columnKey: string) => {
    switch (columnKey) {
      case "category":
        return editingTask === task.id ? (
          <Input
            value={editingData.category || ""}
            onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
            className="bg-surface border-border h-8"
          />
        ) : (
          <div className="font-medium text-foreground">{task.category}</div>
        );

      case "subCategory":
        return editingTask === task.id ? (
          <Input
            value={editingData.subCategory || ""}
            onChange={(e) => setEditingData(prev => ({ ...prev, subCategory: e.target.value }))}
            className="bg-surface border-border h-8"
          />
        ) : (
          <div className="font-medium text-foreground">{task.subCategory}</div>
        );

      case "team":
        return editingTask === task.id ? (
          <Select 
            value={editingData.team || task.team}
            onValueChange={(value) => setEditingData(prev => ({ ...prev, team: value }))}
          >
            <SelectTrigger className="bg-surface border-border h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              {teams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline">{task.team}</Badge>
        );

      case "status":
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${task.status === 'active' ? 'bg-success' : 'bg-muted'}`} />
            <span className={task.status === 'active' ? 'text-success' : 'text-foreground-muted'}>
              {task.status}
            </span>
          </div>
        );

      case "type":
        return editingTask === task.id ? (
          <Select 
            value={editingData.type || task.type}
            onValueChange={(value: "direct" | "indirect") => setEditingData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="bg-surface border-border h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="indirect">Indirect</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={task.type === 'direct' ? 'default' : 'secondary'}>
            {task.type}
          </Badge>
        );

      default:
        return null;
    }
  };

  const handleBulkUploadData = async (data: Record<string, string>[]): Promise<any> => {
    const successful: Task[] = [];
    const errors: any[] = [];

    data.forEach((row, index) => {
      try {
        const task: Task = {
          id: Date.now().toString() + index,
          category: row["Category"] || "",
          subCategory: row["Sub Category"] || "",
          team: row["Team"] || "",
          status: "active",
          type: (row["Type"] as "direct" | "indirect") || "direct",
          // Backend fields
          description: row["Description"] || "",
          estimatedTime: parseInt(row["Estimated Time (mins)"]) || 30,
          priority: (row["Priority"] as "low" | "medium" | "high") || "medium",
          createdBy: localStorage.getItem("userEmail") || "",
          createdAt: new Date().toISOString().split('T')[0]
        };
        successful.push(task);
      } catch (error) {
        errors.push({ row: index + 1, error: "Invalid data format" });
      }
    });

    setTasks(prev => [...prev, ...successful]);
    
    return {
      successful: successful.length,
      failed: errors.length,
      errors
    };
  };

  const handleExport = () => {
    const csvContent = [
      ["Category", "Sub Category", "Team", "Status", "Type"],
      ...tasks.map(task => [
        task.category, task.subCategory, task.team, task.status, task.type
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const bulkUploadValidation = {
    "Category": (value: string) => value.length < 2 ? "Category name too short" : null,
    "Sub Category": (value: string) => value.length < 2 ? "Sub category name too short" : null,
    "Team": (value: string) => !teams.includes(value) ? `Team must be one of: ${teams.join(", ")}` : null,
    "Type": (value: string) => !["direct", "indirect"].includes(value) ? "Type must be direct or indirect" : null
  };

  const sampleData = [
    {
      "Category": "Customer Support",
      "Sub Category": "Phone Support",
      "Team": "Support",
      "Type": "direct"
    }
  ];

  if (showBulkUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
        <BulkUpload
          title="Bulk Upload Tasks"
          templateColumns={["Category", "Sub Category", "Team", "Type"]}
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
            <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
            <p className="text-foreground-muted">Manage and organize your task definitions</p>
          </div>
          <div className="flex gap-2">
            {selectedTasks.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedTasks.length})
              </Button>
            )}
            <ColumnManagerTrigger onClick={() => setShowColumnManager(true)} />
            {canManageTasks && (
              <>
                <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={handleAddTask}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface border-border"
              />
            </div>
          </div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48 bg-surface border-border">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              <SelectItem value="all">All Teams</SelectItem>
              {teams.filter(team => team !== "All Teams").map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Excel-style Table */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tasks ({filteredTasks.length})</span>
              {canManageTasks && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                    onCheckedChange={toggleAllTasks}
                  />
                  <span className="text-sm text-foreground-muted">Select All</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    {canManageTasks && (
                      <th className="w-12 p-3 text-left">
                        <Checkbox
                          checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                          onCheckedChange={toggleAllTasks}
                        />
                      </th>
                    )}
                    {columns.filter(col => col.visible).map(column => (
                      <th key={column.key} className="p-3 text-left font-semibold">
                        {column.label}
                      </th>
                    ))}
                    {canManageTasks && <th className="p-3 text-left font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      {canManageTasks && (
                        <td className="p-3">
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={() => toggleTaskSelection(task.id)}
                          />
                        </td>
                      )}
                      {columns.filter(col => col.visible).map(column => (
                        <td key={column.key} className="p-3">
                          {renderCell(task, column.key)}
                        </td>
                      ))}
                      {canManageTasks && (
                        <td className="p-3">
                          <div className="flex gap-1">
                            {editingTask === task.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleSaveTask}
                                  className="w-8 h-8 hover:bg-success/10 hover:text-success"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleCancelEdit}
                                  className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTask(task)}
                                  className="w-8 h-8"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="w-8 h-8"
                                >
                                  <CheckCircle className={`w-4 h-4 ${task.status === 'active' ? 'text-success' : 'text-foreground-muted'}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteTask(task.id)}
                                  className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <div className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Found</h3>
                <p className="text-foreground-muted">
                  {searchTerm || filterTeam !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first task"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <ColumnManager
        columns={columns}
        onColumnsChange={handleColumnsChange}
        isOpen={showColumnManager}
        onClose={() => setShowColumnManager(false)}
      />
    </div>
  );
};

export default Tasks;