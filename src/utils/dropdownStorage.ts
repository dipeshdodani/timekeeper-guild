import { DropdownData, TaskWithAHT, University, Domain, ClientType, StubName } from "@/types/dropdown";

const STORAGE_KEY = "timesheet_dropdown_data";

// Default data to populate initially
const DEFAULT_DROPDOWN_DATA: DropdownData = {
  universities: [
    { name: "Harvard University" },
    { name: "MIT" },
    { name: "Stanford University" },
    { name: "University of California" }
  ],
  domains: [
    { name: "Computer Science" },
    { name: "Business Administration" },
    { name: "Engineering" },
    { name: "Customer Service" }
  ],
  clientTypes: [
    { name: "Premium", description: "High priority premium client", priority: "High" },
    { name: "Standard", description: "Regular client with standard support", priority: "Medium" },
    { name: "Basic", description: "Basic support client", priority: "Low" },
    { name: "Enterprise", description: "Large enterprise client", priority: "Critical" }
  ],
  stubs: [
    { name: "Student Support" },
    { name: "Academic Services" },
    { name: "Technical Support" },
    { name: "Administrative" }
  ],
  tasks: [
    { category: "Customer Support", subCategory: "Phone Support", aht: 15 },
    { category: "Customer Support", subCategory: "Email Support", aht: 10 },
    { category: "Technical", subCategory: "Code Review", aht: 30 },
    { category: "Technical", subCategory: "Bug Fixing", aht: 90 },
    { category: "Content", subCategory: "Documentation", aht: 45 }
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
    tasks: data.tasks.map(t => `${t.category} - ${t.subCategory}`),
    statuses: ["Not Started", "WIP", "On Hold - Client", "On Hold - Dev", "Completed"]
  };
};

// Get AHT for a specific task
export const getTaskAHT = (taskName: string): number | null => {
  const data = getDropdownData();
  const task = data.tasks.find(t => `${t.category} - ${t.subCategory}` === taskName);
  return task ? task.aht : null;
};