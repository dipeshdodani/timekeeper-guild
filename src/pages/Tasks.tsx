import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
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
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<{
    name: string;
    description: string;
    category: string;
    estimatedTime: number;
    priority: "low" | "medium" | "high";
  }>({
    name: "",
    description: "",
    category: "",
    estimatedTime: 30,
    priority: "medium"
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/");
      return;
    }
    setUserRole(role);
    
    // Load sample tasks
    const sampleTasks: Task[] = [
      {
        id: "1",
        name: "Customer Support Call",
        description: "Handle customer inquiries and provide support",
        category: "Support",
        estimatedTime: 15,
        priority: "medium",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-15"
      },
      {
        id: "2", 
        name: "Technical Documentation",
        description: "Create and update technical documentation",
        category: "Documentation",
        estimatedTime: 45,
        priority: "high",
        status: "active",
        createdBy: "sme@company.com",
        createdAt: "2024-01-10"
      },
      {
        id: "3",
        name: "Code Review",
        description: "Review team member's code submissions",
        category: "Development",
        estimatedTime: 30,
        priority: "high",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-12"
      },
      {
        id: "4",
        name: "Training Session",
        description: "Conduct training for new team members",
        category: "Training",
        estimatedTime: 120,
        priority: "medium",
        status: "inactive",
        createdBy: "sme@company.com",
        createdAt: "2024-01-08"
      }
    ];
    setTasks(sampleTasks);
  }, [navigate]);

  const canManageTasks = userRole === "sme" || userRole === "admin" || userRole === "super-user";

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || task.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddTask = () => {
    if (!newTask.name || !newTask.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: "active",
      createdBy: localStorage.getItem("userEmail") || "",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      name: "",
      description: "",
      category: "",
      estimatedTime: 30,
      priority: "medium"
    });
    setIsAddingTask(false);
    
    toast({
      title: "Success",
      description: "Task added successfully"
    });
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

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "secondary",
      medium: "default", 
      high: "destructive"
    };
    return variants[priority as keyof typeof variants] || "default";
  };

  const getStatusIcon = (status: string) => {
    return status === "active" ? CheckCircle : Clock;
  };

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
          {canManageTasks && (
            <Button 
              onClick={() => setIsAddingTask(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48 bg-surface border-border">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Support">Support</SelectItem>
              <SelectItem value="Documentation">Documentation</SelectItem>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Task Modal */}
        {isAddingTask && (
          <Card className="mb-6 shadow-medium border-border">
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
              <CardDescription>Create a new task definition for your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskName">Task Name *</Label>
                  <Input
                    id="taskName"
                    value={newTask.name}
                    onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter task name"
                    className="bg-surface border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={newTask.category} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-surface border-border">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  className="bg-surface border-border"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={newTask.estimatedTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 30 }))}
                    className="bg-surface border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value: "low" | "medium" | "high") => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="bg-surface border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddTask}>Add Task</Button>
                <Button variant="outline" onClick={() => setIsAddingTask(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const StatusIcon = getStatusIcon(task.status);
            return (
              <Card key={task.id} className="shadow-soft border-border hover:shadow-medium transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${task.status === 'active' ? 'text-success' : 'text-foreground-muted'}`} />
                        {task.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={getPriorityBadge(task.priority) as any}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline">{task.category}</Badge>
                      </div>
                    </div>
                    {canManageTasks && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTaskStatus(task.id)}
                          className="w-8 h-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground-muted text-sm mb-3">{task.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-foreground-subtle">
                      <Clock className="w-4 h-4" />
                      {task.estimatedTime} min
                    </div>
                    <div className="text-foreground-subtle">
                      by {task.createdBy.split('@')[0]}
                    </div>
                  </div>
                  <div className="text-xs text-foreground-subtle mt-2">
                    Created: {task.createdAt}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <Card className="p-8 text-center shadow-soft border-border">
            <AlertTriangle className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Found</h3>
            <p className="text-foreground-muted">
              {searchTerm || filterCategory !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first task"
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tasks;