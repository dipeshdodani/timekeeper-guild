import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Search, Edit, Trash2, Save, X, Upload, Download, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BulkUpload, { type BulkUploadResult } from "@/components/BulkUpload";

interface Client {
  id: string;
  university: string;
  domain: string;
  clientType: "New" | "BAU";
  contactName: string;
  contactEmail: string;
  phone: string;
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
}

const Clients = () => {
  const [userRole, setUserRole] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Client>>({});
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
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
    
    // Load sample clients
    const sampleClients: Client[] = [
      {
        id: "1",
        university: "Harvard University",
        domain: "Healthcare",
        clientType: "New",
        contactName: "Dr. Sarah Johnson",
        contactEmail: "s.johnson@harvard.edu",
        phone: "+1-617-495-1000",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-15"
      },
      {
        id: "2",
        university: "MIT",
        domain: "Technology",
        clientType: "BAU",
        contactName: "Prof. John Smith",
        contactEmail: "j.smith@mit.edu",
        phone: "+1-617-253-1000",
        status: "active",
        createdBy: "sme@company.com",
        createdAt: "2024-01-10"
      },
      {
        id: "3",
        university: "Stanford University",
        domain: "Finance",
        clientType: "New",
        contactName: "Dr. Lisa Chen",
        contactEmail: "l.chen@stanford.edu",
        phone: "+1-650-723-2300",
        status: "active",
        createdBy: "admin@company.com",
        createdAt: "2024-01-12"
      }
    ];
    setClients(sampleClients);
  }, [navigate]);

  const canManageClients = userRole === "sme" || userRole === "admin" || userRole === "super-user";

  const universities = ["Harvard University", "MIT", "Stanford University", "Yale University", "Princeton University"];
  const domains = ["Healthcare", "Technology", "Finance", "Education", "Research"];

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = filterDomain === "all" || client.domain === filterDomain;
    const matchesType = filterType === "all" || client.clientType === filterType;
    return matchesSearch && matchesDomain && matchesType;
  });

  const handleAddClient = () => {
    const newClient: Client = {
      id: Date.now().toString(),
      university: "New University",
      domain: "Healthcare",
      clientType: "New",
      contactName: "Contact Name",
      contactEmail: "contact@university.edu",
      phone: "+1-000-000-0000",
      status: "active",
      createdBy: localStorage.getItem("userEmail") || "",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setClients(prev => [...prev, newClient]);
    setEditingClient(newClient.id);
    setEditingData(newClient);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client.id);
    setEditingData({ ...client });
  };

  const handleSaveClient = () => {
    if (!editingClient || !editingData.university || !editingData.contactName) return;

    setClients(prev => prev.map(client => 
      client.id === editingClient 
        ? { ...client, ...editingData }
        : client
    ));
    
    setEditingClient(null);
    setEditingData({});
    
    toast({
      title: "Success",
      description: "Client updated successfully"
    });
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setEditingData({});
  };

  const deleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
    toast({
      title: "Client Deleted",
      description: "Client has been removed successfully"
    });
  };

  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return;
    
    setClients(prev => prev.filter(client => !selectedClients.includes(client.id)));
    setSelectedClients([]);
    
    toast({
      title: "Clients Deleted",
      description: `${selectedClients.length} clients have been removed`
    });
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAllClients = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "New" ? "default" : "secondary";
  };

  const handleBulkUpload = async (data: Record<string, string>[]): Promise<BulkUploadResult> => {
    const successful: Client[] = [];
    const errors: any[] = [];

    data.forEach((row, index) => {
      try {
        const client: Client = {
          id: Date.now().toString() + index,
          university: row["University"] || "",
          domain: row["Domain"] || "",
          clientType: (row["Client Type"] as "New" | "BAU") || "New",
          contactName: row["Contact Name"] || "",
          contactEmail: row["Contact Email"] || "",
          phone: row["Phone"] || "",
          status: "active",
          createdBy: localStorage.getItem("userEmail") || "",
          createdAt: new Date().toISOString().split('T')[0]
        };
        successful.push(client);
      } catch (error) {
        errors.push({ row: index + 1, error: "Invalid data format" });
      }
    });

    setClients(prev => [...prev, ...successful]);
    
    return {
      successful: successful.length,
      failed: errors.length,
      errors
    };
  };

  const handleExport = () => {
    const csvContent = [
      ["University", "Domain", "Client Type", "Contact Name", "Contact Email", "Phone", "Status", "Created By", "Created Date"],
      ...clients.map(client => [
        client.university, client.domain, client.clientType, client.contactName, 
        client.contactEmail, client.phone, client.status, client.createdBy, client.createdAt
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const bulkUploadValidation = {
    "University": (value: string) => value.length < 2 ? "University name too short" : null,
    "Contact Email": (value: string) => !value.includes("@") ? "Invalid email format" : null,
    "Client Type": (value: string) => !["New", "BAU"].includes(value) ? "Must be 'New' or 'BAU'" : null,
    "Domain": (value: string) => !domains.includes(value) ? `Domain must be one of: ${domains.join(", ")}` : null
  };

  const sampleData = [
    {
      "University": "Harvard University",
      "Domain": "Healthcare", 
      "Client Type": "New",
      "Contact Name": "Dr. Sarah Johnson",
      "Contact Email": "s.johnson@harvard.edu",
      "Phone": "+1-617-495-1000"
    },
    {
      "University": "MIT",
      "Domain": "Technology",
      "Client Type": "BAU", 
      "Contact Name": "Prof. John Smith",
      "Contact Email": "j.smith@mit.edu",
      "Phone": "+1-617-253-1000"
    }
  ];

  if (showBulkUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-elevated p-6">
        <BulkUpload
          title="Bulk Upload Clients"
          templateColumns={["University", "Domain", "Client Type", "Contact Name", "Contact Email", "Phone"]}
          sampleData={sampleData}
          onUpload={handleBulkUpload}
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
            <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
            <p className="text-foreground-muted">Manage university clients and contacts</p>
          </div>
          <div className="flex gap-2">
            {selectedClients.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedClients.length})
              </Button>
            )}
            {canManageClients && (
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
                  onClick={handleAddClient}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
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
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-surface border-border"
              />
            </div>
          </div>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-48 bg-surface border-border">
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map(domain => (
                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 bg-surface border-border">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-surface border-border z-50">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="BAU">BAU</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{clients.length}</div>
              <div className="text-sm text-foreground-muted">Total Clients</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-success">{clients.filter(c => c.status === "active").length}</div>
              <div className="text-sm text-foreground-muted">Active</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-warning">{clients.filter(c => c.clientType === "New").length}</div>
              <div className="text-sm text-foreground-muted">New Clients</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{domains.length}</div>
              <div className="text-sm text-foreground-muted">Domains</div>
            </CardContent>
          </Card>
        </div>

        {/* Excel-style Table */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Clients ({filteredClients.length})</span>
              {canManageClients && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    onCheckedChange={toggleAllClients}
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
                    {canManageClients && (
                      <th className="w-12 p-3 text-left">
                        <Checkbox
                          checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                          onCheckedChange={toggleAllClients}
                        />
                      </th>
                    )}
                    <th className="p-3 text-left font-semibold">University</th>
                    <th className="p-3 text-left font-semibold">Domain</th>
                    <th className="p-3 text-left font-semibold">Type</th>
                    <th className="p-3 text-left font-semibold">Contact</th>
                    <th className="p-3 text-left font-semibold">Email</th>
                    <th className="p-3 text-left font-semibold">Phone</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    {canManageClients && <th className="p-3 text-left font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      {canManageClients && (
                        <td className="p-3">
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={() => toggleClientSelection(client.id)}
                          />
                        </td>
                      )}
                      <td className="p-3">
                        {editingClient === client.id ? (
                          <Input
                            value={editingData.university || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, university: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="font-medium text-foreground flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            {client.university}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingClient === client.id ? (
                          <Select 
                            value={editingData.domain || client.domain}
                            onValueChange={(value) => setEditingData(prev => ({ ...prev, domain: value }))}
                          >
                            <SelectTrigger className="bg-surface border-border h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-surface border-border z-50">
                              {domains.map(domain => (
                                <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{client.domain}</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {editingClient === client.id ? (
                          <Select 
                            value={editingData.clientType || client.clientType}
                            onValueChange={(value: "New" | "BAU") => setEditingData(prev => ({ ...prev, clientType: value }))}
                          >
                            <SelectTrigger className="bg-surface border-border h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-surface border-border z-50">
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="BAU">BAU</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getTypeBadge(client.clientType) as any}>
                            {client.clientType}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {editingClient === client.id ? (
                          <Input
                            value={editingData.contactName || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, contactName: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="text-foreground">{client.contactName}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingClient === client.id ? (
                          <Input
                            type="email"
                            value={editingData.contactEmail || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, contactEmail: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="text-foreground-muted">{client.contactEmail}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingClient === client.id ? (
                          <Input
                            value={editingData.phone || ""}
                            onChange={(e) => setEditingData(prev => ({ ...prev, phone: e.target.value }))}
                            className="bg-surface border-border h-8"
                          />
                        ) : (
                          <div className="text-foreground-muted">{client.phone}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-success' : 'bg-muted'}`} />
                          <span className={client.status === 'active' ? 'text-success' : 'text-foreground-muted'}>
                            {client.status}
                          </span>
                        </div>
                      </td>
                      {canManageClients && (
                        <td className="p-3">
                          <div className="flex gap-1">
                            {editingClient === client.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleSaveClient}
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
                                  onClick={() => handleEditClient(client)}
                                  className="w-8 h-8 hover:bg-primary/10 hover:text-primary"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteClient(client.id)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Clients;