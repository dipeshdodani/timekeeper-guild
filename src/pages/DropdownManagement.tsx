import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Database, 
  GraduationCap, 
  Globe, 
  Users, 
  FileText, 
  CheckSquare,
  Plus,
  Upload,
  Download,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownBulkUpload } from "@/components/DropdownBulkUpload";
import { 
  getDropdownData, 
  updateUniversities, 
  updateDomains, 
  updateClientTypes, 
  updateStubs, 
  updateTasks 
} from "@/utils/dropdownStorage";
import { 
  DropdownData, 
  DropdownType, 
  BulkUploadResult, 
  University as UniversityType, 
  Domain as DomainType, 
  ClientType as ClientTypeType, 
  StubName as StubNameType, 
  TaskWithAHT 
} from "@/types/dropdown";

const DropdownManagement = () => {
  const [userRole, setUserRole] = useState<string>("");
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    universities: [],
    domains: [],
    clientTypes: [],
    stubs: [],
    tasks: []
  });
  const [showBulkUpload, setShowBulkUpload] = useState<{
    type: DropdownType | null;
    title: string;
  }>({ type: null, title: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || (role !== "admin" && role !== "super-user")) {
      navigate("/dashboard");
      return;
    }
    setUserRole(role);
    loadDropdownData();
  }, [navigate]);

  const loadDropdownData = () => {
    const data = getDropdownData();
    setDropdownData(data);
  };

  const handleBulkUpload = async (type: DropdownType, data: any[]): Promise<BulkUploadResult> => {
    try {
      let processedData: any[] = [];
      
      switch (type) {
        case 'universities':
          processedData = data.map(row => ({
            name: row.Name,
            country: row.Country,
            state: row.State,
            type: row.Type
          }));
          updateUniversities(processedData as UniversityType[]);
          break;
          
        case 'domains':
          processedData = data.map(row => ({
            name: row.Name,
            description: row.Description,
            category: row.Category
          }));
          updateDomains(processedData as DomainType[]);
          break;
          
        case 'clientTypes':
          processedData = data.map(row => ({
            name: row.Name,
            description: row.Description,
            priority: row.Priority
          }));
          updateClientTypes(processedData as ClientTypeType[]);
          break;
          
        case 'stubs':
          processedData = data.map(row => ({
            name: row.Name,
            description: row.Description,
            team: row.Team
          }));
          updateStubs(processedData as StubNameType[]);
          break;
          
        case 'tasks':
          processedData = data.map(row => ({
            name: row.Task_Name,
            aht: parseInt(row.AHT_Minutes) || 0
          }));
          updateTasks(processedData as TaskWithAHT[]);
          break;
      }

      loadDropdownData(); // Refresh the data
      setShowBulkUpload({ type: null, title: "" });
      
      return {
        successful: processedData.length,
        failed: 0,
        errors: []
      };
    } catch (error) {
      return {
        successful: 0,
        failed: data.length,
        errors: [{ row: 0, field: "General", value: "", error: "Upload failed" }]
      };
    }
  };

  const exportData = (type: DropdownType) => {
    let csvContent = "";
    let filename = "";
    
    switch (type) {
      case 'universities':
        csvContent = [
          ["Name", "Country", "State", "Type"],
          ...dropdownData.universities.map(u => [u.name, u.country, u.state, u.type])
        ].map(row => row.join(",")).join("\n");
        filename = "universities_export.csv";
        break;
        
      case 'domains':
        csvContent = [
          ["Name", "Description", "Category"],
          ...dropdownData.domains.map(d => [d.name, d.description, d.category])
        ].map(row => row.join(",")).join("\n");
        filename = "domains_export.csv";
        break;
        
      case 'clientTypes':
        csvContent = [
          ["Name", "Description", "Priority"],
          ...dropdownData.clientTypes.map(c => [c.name, c.description, c.priority])
        ].map(row => row.join(",")).join("\n");
        filename = "client_types_export.csv";
        break;
        
      case 'stubs':
        csvContent = [
          ["Name", "Description", "Team"],
          ...dropdownData.stubs.map(s => [s.name, s.description, s.team])
        ].map(row => row.join(",")).join("\n");
        filename = "stubs_export.csv";
        break;
        
      case 'tasks':
        csvContent = [
          ["Task_Name", "AHT_Minutes"],
          ...dropdownData.tasks.map(t => [t.name, t.aht.toString()])
        ].map(row => row.join(",")).join("\n");
        filename = "tasks_export.csv";
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `${type} data exported successfully`
    });
  };

  const clearAllData = (type: DropdownType) => {
    if (!confirm(`Are you sure you want to clear all ${type} data? This action cannot be undone.`)) {
      return;
    }
    
    switch (type) {
      case 'universities':
        updateUniversities([]);
        break;
      case 'domains':
        updateDomains([]);
        break;
      case 'clientTypes':
        updateClientTypes([]);
        break;
      case 'stubs':
        updateStubs([]);
        break;
      case 'tasks':
        updateTasks([]);
        break;
    }
    
    loadDropdownData();
    toast({
      title: "Data Cleared",
      description: `All ${type} data has been cleared`,
      variant: "destructive"
    });
  };

  const dropdownSections = [
    {
      id: 'universities' as DropdownType,
      title: 'Universities',
      description: 'Manage university list with country and type information',
      icon: GraduationCap,
      data: dropdownData.universities,
      columns: ['Name', 'Country', 'State', 'Type']
    },
    {
      id: 'domains' as DropdownType,
      title: 'Domains',
      description: 'Manage domain categories and descriptions',
      icon: Globe,
      data: dropdownData.domains,
      columns: ['Name', 'Description', 'Category']
    },
    {
      id: 'clientTypes' as DropdownType,
      title: 'Client Types',
      description: 'Manage client types with priority levels',
      icon: Users,
      data: dropdownData.clientTypes,
      columns: ['Name', 'Description', 'Priority']
    },
    {
      id: 'stubs' as DropdownType,
      title: 'Stub Names',
      description: 'Manage stub names and team assignments',
      icon: FileText,
      data: dropdownData.stubs,
      columns: ['Name', 'Description', 'Team']
    },
    {
      id: 'tasks' as DropdownType,
      title: 'Tasks with AHT',
      description: 'Manage tasks with Average Handle Time (AHT) in minutes',
      icon: CheckSquare,
      data: dropdownData.tasks,
      columns: ['Task Name', 'AHT (min)']
    }
  ];

  if (showBulkUpload.type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated">
        <div className="container mx-auto p-6">
          <div className="max-w-4xl mx-auto">
            <DropdownBulkUpload
              title={showBulkUpload.title}
              type={showBulkUpload.type}
              onUpload={(data) => handleBulkUpload(showBulkUpload.type!, data)}
              onCancel={() => setShowBulkUpload({ type: null, title: "" })}
            />
          </div>
        </div>
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
            <h1 className="text-3xl font-bold text-foreground">Dropdown Management</h1>
            <p className="text-foreground-muted">Manage all dropdown lists and their data</p>
          </div>
          <Badge variant="secondary">{userRole}</Badge>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="universities" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            {dropdownSections.map(section => (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                <section.icon className="w-4 h-4" />
                <span className="hidden md:inline">{section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {dropdownSections.map(section => (
            <TabsContent key={section.id} value={section.id}>
              <Card className="shadow-soft border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <section.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {section.data.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowBulkUpload({ 
                        type: section.id, 
                        title: `Bulk Upload ${section.title}` 
                      })}
                      className="flex-1 md:flex-initial"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportData(section.id)}
                      disabled={section.data.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => clearAllData(section.id)}
                      disabled={section.data.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  {/* Data Table */}
                  {section.data.length > 0 ? (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm">
                          <thead className="bg-muted border-b border-border">
                            <tr>
                              {section.columns.map(column => (
                                <th key={column} className="text-left p-3 font-medium">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.data.map((item: any, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/50">
                                {section.id === 'universities' && (
                                  <>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.country}</td>
                                    <td className="p-3">{item.state}</td>
                                    <td className="p-3">{item.type}</td>
                                  </>
                                )}
                                {section.id === 'domains' && (
                                  <>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3">{item.category}</td>
                                  </>
                                )}
                                {section.id === 'clientTypes' && (
                                  <>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3">{item.priority}</td>
                                  </>
                                )}
                                {section.id === 'stubs' && (
                                  <>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3">{item.team}</td>
                                  </>
                                )}
                                {section.id === 'tasks' && (
                                  <>
                                    <td className="p-3">{item.name}</td>
                                    <td className="p-3">
                                      <Badge variant="secondary">{item.aht}min</Badge>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground-muted">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No {section.title.toLowerCase()} data available</p>
                      <p className="text-sm">Use bulk upload to add data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default DropdownManagement;