// Dropdown data type definitions
export interface TaskWithAHT {
  category: string;
  subCategory: string;
  aht: number; // in minutes
}

export interface University {
  name: string;
  domain: string;
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

export type DropdownType = 'universities' | 'domains' | 'stubs' | 'tasks';

export const DROPDOWN_TEMPLATES = {
  universities: [
    { field: 'University', example: 'Harvard University' },
    { field: 'Domain', example: 'Computer Science' }
  ],
  domains: [
    { field: 'Name', example: 'Computer Science' },
    { field: 'Description', example: 'Software and technology related tasks' },
    { field: 'Category', example: 'Technical' }
  ],
  stubs: [
    { field: 'Name', example: 'Student Support' },
    { field: 'Description', example: 'General student assistance' },
    { field: 'Team', example: 'Support Team Alpha' }
  ],
  tasks: [
    { field: 'Category', example: 'Customer Support' },
    { field: 'Sub_Category', example: 'Phone Support' },
    { field: 'AHT', example: '15' }
  ]
};