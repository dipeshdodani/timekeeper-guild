// Dropdown data type definitions
export interface TaskWithAHT {
  category: string;
  subCategory: string;
  aht: number; // in minutes
}

export interface University {
  name: string;
}

export interface Domain {
  name: string;
}

export interface ClientType {
  name: string;
  description: string;
  priority: string;
}

export interface StubName {
  name: string;
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

export type DropdownType = 'universities' | 'domains';

export const DROPDOWN_TEMPLATES = {
  universities: [
    { field: 'University', example: 'Harvard University' }
  ],
  domains: [
    { field: 'Domain', example: 'Computer Science' }
  ]
};