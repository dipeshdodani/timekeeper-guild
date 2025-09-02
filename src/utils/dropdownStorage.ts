import { DropdownData, TaskWithAHT, University, Domain, ClientType, StubName } from "@/types/dropdown";

const STORAGE_KEY = "timesheet_dropdown_data";

// Default data to populate initially
const DEFAULT_DROPDOWN_DATA: DropdownData = {
  universities: [
    { name: "Harvard University", country: "United States", state: "Massachusetts", type: "Private" },
    { name: "MIT", country: "United States", state: "Massachusetts", type: "Private" },
    { name: "Stanford University", country: "United States", state: "California", type: "Private" },
    { name: "University of California", country: "United States", state: "California", type: "Public" }
  ],
  domains: [
    { name: "Computer Science", description: "Software and technology related tasks", category: "Technical" },
    { name: "Business Administration", description: "Business and management tasks", category: "Business" },
    { name: "Engineering", description: "Engineering and technical support", category: "Technical" },
    { name: "Customer Service", description: "Customer support and service", category: "Support" }
  ],
  clientTypes: [
    { name: "Premium", description: "High priority premium client", priority: "High" },
    { name: "Standard", description: "Regular client with standard support", priority: "Medium" },
    { name: "Basic", description: "Basic support client", priority: "Low" },
    { name: "Enterprise", description: "Large enterprise client", priority: "Critical" }
  ],
  stubs: [
    { name: "Student Support", description: "General student assistance", team: "Support Team Alpha" },
    { name: "Academic Services", description: "Academic related services", team: "Academic Team" },
    { name: "Technical Support", description: "Technical assistance", team: "Tech Team" },
    { name: "Administrative", description: "Administrative tasks", team: "Admin Team" }
  ],
  tasks: [
    { name: "Customer Support", aht: 15, description: "Handle customer inquiries", category: "Support", domain: "Customer Service" },
    { name: "Code Review", aht: 30, description: "Review and validate code submissions", category: "Technical", domain: "Computer Science" },
    { name: "Documentation", aht: 45, description: "Create and update documentation", category: "Administrative", domain: "General" },
    { name: "Training", aht: 60, description: "Conduct training sessions", category: "Education", domain: "General" },
    { name: "Bug Fixing", aht: 90, description: "Identify and fix software bugs", category: "Technical", domain: "Computer Science" }
  ]
};

export const getDropdownData = (): DropdownData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading dropdown data from localStorage:", error);
  }
  
  // Initialize with default data if not found
  setDropdownData(DEFAULT_DROPDOWN_DATA);
  return DEFAULT_DROPDOWN_DATA;
};

export const setDropdownData = (data: DropdownData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving dropdown data to localStorage:", error);
  }
};

export const updateUniversities = (universities: University[]): void => {
  const data = getDropdownData();
  data.universities = universities;
  setDropdownData(data);
};

export const updateDomains = (domains: Domain[]): void => {
  const data = getDropdownData();
  data.domains = domains;
  setDropdownData(data);
};

export const updateClientTypes = (clientTypes: ClientType[]): void => {
  const data = getDropdownData();
  data.clientTypes = clientTypes;
  setDropdownData(data);
};

export const updateStubs = (stubs: StubName[]): void => {
  const data = getDropdownData();
  data.stubs = stubs;
  setDropdownData(data);
};

export const updateTasks = (tasks: TaskWithAHT[]): void => {
  const data = getDropdownData();
  data.tasks = tasks;
  setDropdownData(data);
};

// Get simplified arrays for existing components
export const getSimpleDropdownData = () => {
  const data = getDropdownData();
  return {
    stubs: data.stubs.map(s => s.name),
    universities: data.universities.map(u => u.name),
    domains: data.domains.map(d => d.name),
    clientTypes: data.clientTypes.map(c => c.name),
    tasks: data.tasks.map(t => t.name),
    statuses: ["Not Started", "WIP", "On Hold - Client", "On Hold - Dev", "Completed"]
  };
};

// Get AHT for a specific task
export const getTaskAHT = (taskName: string): number | null => {
  const data = getDropdownData();
  const task = data.tasks.find(t => t.name === taskName);
  return task ? task.aht : null;
};