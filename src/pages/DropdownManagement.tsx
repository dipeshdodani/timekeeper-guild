import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Trash2,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownBulkUpload } from "@/components/DropdownBulkUpload";
import { 
  getDropdownData, 
  updateUniversities, 
  updateDomains
} from "@/utils/dropdownStorage";
import { 
  DropdownData, 
  DropdownType, 
  BulkUploadResult, 
  University as UniversityType, 
  Domain as DomainType
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
  const [newItemName, setNewItemName] = useState<string>("");
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
            name: row.University
          }));
          updateUniversities(processedData as UniversityType[]);
          break;
          
        case 'domains':
          processedData = data.map(row => ({
            name: row.Domain || row.domain || row.Name || row.name || ''
          }));
          updateDomains(processedData as DomainType[]);
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
          ["University"],
          ...dropdownData.universities.map(u => [u.name])
        ].map(row => row.join(",")).join("\n");
        filename = "universities_export.csv";
        break;
        
      case 'domains':
        csvContent = [
          ["Domain"],
          ...dropdownData.domains.map(d => [d.name])
        ].map(row => row.join(",")).join("\n");
        filename = "domains_export.csv";
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
    }
    
    loadDropdownData();
    toast({
      title: "Data Cleared",
      description: `All ${type} data has been cleared`,
      variant: "destructive"
    });
  };

  const addItem = (type: DropdownType) => {
    const trimmedName = newItemName.trim();
    
    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive"
      });
      return;
    }

    switch (type) {
      case 'universities':
        const existingUniversity = dropdownData.universities.find(u => u.name === trimmedName);
        if (existingUniversity) {
          toast({
            title: "Error",
            description: "This university already exists",
            variant: "destructive"
          });
          return;
        }
        updateUniversities([...dropdownData.universities, { name: trimmedName }]);
        break;
      case 'domains':
        const existingDomain = dropdownData.domains.find(d => d.name === trimmedName);
        if (existingDomain) {
          toast({
            title: "Error",
            description: "This domain already exists",
            variant: "destructive"
          });
          return;
        }
        updateDomains([...dropdownData.domains, { name: trimmedName }]);
        break;
    }

    setNewItemName("");
    loadDropdownData();
    toast({
      title: "Added Successfully",
      description: `${trimmedName} has been added to ${type}`
    });
  };

  const removeItem = (type: DropdownType, itemName: string) => {
    switch (type) {
      case 'universities':
        updateUniversities(dropdownData.universities.filter(u => u.name !== itemName));
        break;
      case 'domains':
        updateDomains(dropdownData.domains.filter(d => d.name !== itemName));
        break;
    }

    loadDropdownData();
    toast({
      title: "Removed Successfully",
      description: `${itemName} has been removed`
    });
  };

  const dropdownSections = [
    {
      id: 'universities' as DropdownType,
      title: 'Universities',
      description: 'Manage university list',
      icon: GraduationCap,
      data: dropdownData.universities,
      columns: ['University']
    },
    {
      id: 'domains' as DropdownType,
      title: 'Domains',
      description: 'Manage domain categories',
      icon: Globe,
      data: dropdownData.domains,
      columns: ['Domain']
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
          <TabsList className="grid grid-cols-2 w-full">
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
                  {/* Add Item Form */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Enter ${section.title.slice(0, -1)} name`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addItem(section.id);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => addItem(section.id)}
                      disabled={!newItemName.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>

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
                              <th className="text-right p-3 font-medium w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                             {section.data.map((item: any, index) => (
                               <tr key={index} className="border-b border-border hover:bg-muted/50">
                                 {section.id === 'universities' && (
                                   <td className="p-3">{item.name}</td>
                                 )}
                                 {section.id === 'domains' && (
                                   <td className="p-3">{item.name}</td>
                                 )}
                                 <td className="p-3 text-right">
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => removeItem(section.id, item.name)}
                                     className="h-8 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                                   >
                                     <X className="w-4 h-4 mr-1" />
                                     Remove
                                   </Button>
                                 </td>
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