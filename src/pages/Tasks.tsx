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

interface Task {
  id: string;
  category: string;
  subCategory: string;
  description: string;
  team: string;
  estimatedTime: number;
  priority: "low" | "medium" | "high";
  status: "active" | "inactive";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);
    
    // Load sample tasks with updated categories
    const sampleTasks: Task[] = [
      {
        id: "1",
        category: "Customer Support",
        subCategory: "Phone Support",
        description: "Handle customer inquiries and provide support",
        team: "Support",
        estimatedTime: 15,
        priority: "medium",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-15"
      },
      {
        id: "2", 
        category: "CI Operations",
        subCategory: "Pipeline Configuration",
        description: "Set up and maintain continuous integration pipelines",
        team: "CI",
        estimatedTime: 45,
        priority: "high",
        status: "active",
        createdBy: "sme@company.com",
        createdAt: "2024-01-10"
      },
      {
        id: "3",
        category: "Database Management",
        subCategory: "Migration Scripts",
        description: "Create and execute database migration procedures",
        team: "Migration",
        estimatedTime: 60,
        priority: "high",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-12"
      },
      {
        id: "4",
        category: "System Configuration",
        subCategory: "Environment Setup",
        description: "Configure system environments and settings",
        team: "Config",
        estimatedTime: 30,
        priority: "medium",
        status: "active",
        createdBy: "sme@company.com",
        createdAt: "2024-01-08"
      },
      {
        id: "5",
        category: "Platform Integration",
        subCategory: "Exxat One",
        description: "Integrate with Exxat One platform systems",
        team: "Exxat One",
        estimatedTime: 90,
        priority: "high",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-14"
      }
    ];
    setTasks(sampleTasks);
  }, [navigate]);

  const canManageTasks = userRole === "sme" || userRole === "admin" || userRole === "super-user";

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === "all" || task.team === filterTeam;
    return matchesSearch && matchesTeam;
  });

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      category: "New Category",
      subCategory: "New Sub Category",
      description: "Task description",
      team: "Support",
      estimatedTime: 30,
      priority: "medium",
      status: "active",
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

  const teams = ["Support", "CI", "Migration", "Config", "Exxat One"];

  const handleBulkUploadData = async (data: Record<string, string>[]): Promise<any> => {
    const successful: Task[] = [];
    const errors: any[] = [];

    data.forEach((row, index) => {
      try {
        const task: Task = {
          id: Date.now().toString() + index,
          category: row["Category"] || "",
          subCategory: row["Sub Category"] || "",
          description: row["Description"] || "",
          team: row["Team"] || "",
          estimatedTime: parseInt(row["Estimated Time (mins)"]) || 30,
          priority: (row["Priority"] as "low" | "medium" | "high") || "medium",
          status: "active",
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
      ["Category", "Sub Category", "Description", "Team", "Estimated Time (mins)", "Priority", "Status", "Created By", "Created Date"],
      ...tasks.map(task => [
        task.category, task.subCategory, task.description, task.team, task.estimatedTime.toString(), 
        task.priority, task.status, task.createdBy, task.createdAt
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
    "Estimated Time (mins)": (value: string) => {
      const num = parseInt(value);
      return isNaN(num) || num <= 0 ? "Must be a positive number" : null;
    },
    "Priority": (value: string) => !["low", "medium", "high"].includes(value) ? "Priority must be low, medium, or high" : null,
    "Team": (value: string) => !teams.includes(value) ? `Team must be one of: ${teams.join(", ")}` : null
  };

  const sampleData = [
    {
      "Category": "Customer Support",
      "Sub Category": "Phone Support",
      "Description": "Handle customer inquiries and provide support",
      "Team": "Support",
      "Estimated Time (mins)": "15",
      "Priority": "medium"
    }
  ];

  if (showBulkUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
        <BulkUpload
          title="Bulk Upload Tasks"
          templateColumns={["Category", "Sub Category", "Description", "Team", "Estimated Time (mins)", "Priority"]}
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
              {teams.map(team => (
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
                    <th className="p-3 text-left font-semibold">Category</th>
                    <th className="p-3 text-left font-semibold">Sub Category</th>
                    <th className="p-3 text-left font-semibold">Description</th>
                    <th className="p-3 text-left font-semibold">Team</th>
                    <th className="p-3 text-left font-semibold">Est. Time</th>
                    <th className="p-3 text-left font-semibold">Priority</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Created By</th>
                    <th className="p-3 text-left font-semibold">Created Date</th>
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
                      <td className="p-3">
                        {editingTask === task.id ? (
                          <Input
                            value={editingData.category || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="font-medium text-foreground">{task.category}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingTask === task.id ? (
                          <Input
                            value={editingData.subCategory || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, subCategory: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="font-medium text-foreground">{task.subCategory}</div>
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        {editingTask === task.id ? (
                          <Input
                            value={editingData.description || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="text-foreground-muted text-sm truncate">{task.description}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingTask === task.id ? (
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
                        )}
                      </td>
                      <td className="p-3">
                        {editingTask === task.id ? (
                          <Input
                            type="number"
                            value={editingData.estimatedTime || task.estimatedTime}
                            onChange={(e) => setEditingData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                            className="bg-surface border-border h-8 w-20"
                          />
                        ) : (
                          <div className="flex items-center gap-1 text-foreground-muted">
                            <Clock className="w-4 h-4" />
                            {task.estimatedTime}m
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingTask === task.id ? (
                          <Select 
                            value={editingData.priority || task.priority}
                            onValueChange={(value: "low" | "medium" | "high") => setEditingData(prev => ({ ...prev, priority: value }))}
                          >
                            <SelectTrigger className="bg-surface border-border h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-surface border-border z-50">
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getPriorityBadge(task.priority) as any}>
                            {task.priority}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.status === 'active' ? 'bg-success' : 'bg-muted'}`} />
                          <span className={task.status === 'active' ? 'text-success' : 'text-foreground-muted'}>
                            {task.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-foreground-muted text-sm">
                        {task.createdBy.split('@')[0]}
                      </td>
                      <td className="p-3 text-foreground-muted text-sm">
                        {task.createdAt}
                      </td>
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
    </div>
  );
};

export default Tasks;