// Dropdown data type definitions
export interface TaskWithAHT {
  name: string;
  aht: number; // in minutes
  description?: string;
  category?: string;
  domain?: string;
}

export interface University {
  name: string;
  country: string;
  state: string;
  type: string;
}

export interface Domain {
  name: string;
  description: string;
  category: string;
}

export interface ClientType {
  name: string;
  description: string;
  priority: string;
}

export interface StubName {
  name: string;
  description: string;
  team: string;
}

export interface DropdownData {
  universities: University[];
  domains: Domain[];
  clientTypes: ClientType[];
  stubs: StubName[];
  tasks: TaskWithAHT[];
}

export interface BulkUploadError {
  row: number;
  field: string;
  value: string;
  error: string;
}

export interface BulkUploadResult {
  successful: number;
  failed: number;
  errors: BulkUploadError[];
}

export type DropdownType = 'universities' | 'domains' | 'clientTypes' | 'stubs' | 'tasks';

export const DROPDOWN_TEMPLATES = {
  universities: [
    { field: 'Name', example: 'Harvard University' },
    { field: 'Country', example: 'United States' },
    { field: 'State', example: 'Massachusetts' },
    { field: 'Type', example: 'Private' }
  ],
  domains: [
    { field: 'Name', example: 'Computer Science' },
    { field: 'Description', example: 'Software and technology related tasks' },
    { field: 'Category', example: 'Technical' }
  ],
  clientTypes: [
    { field: 'Name', example: 'Premium' },
    { field: 'Description', example: 'High priority premium client' },
    { field: 'Priority', example: 'High' }
  ],
  stubs: [
    { field: 'Name', example: 'Student Support' },
    { field: 'Description', example: 'General student assistance' },
    { field: 'Team', example: 'Support Team Alpha' }
  ],
  tasks: [
    { field: 'Task_Name', example: 'Customer Support' },
    { field: 'AHT_Minutes', example: '15' },
    { field: 'Description', example: 'Handle customer inquiries' },
    { field: 'Category', example: 'Support' },
    { field: 'Domain', example: 'Customer Service' }
  ]
};