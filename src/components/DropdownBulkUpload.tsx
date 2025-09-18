import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BulkUploadError, BulkUploadResult, DropdownType, DROPDOWN_TEMPLATES } from "@/types/dropdown";

interface DropdownBulkUploadProps {
  title: string;
  type: DropdownType;
  onUpload: (data: any[]) => Promise<BulkUploadResult>;
  onCancel?: () => void;
}

export const DropdownBulkUpload = ({ 
  title, 
  type, 
  onUpload, 
  onCancel 
}: DropdownBulkUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<BulkUploadError[]>([]);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const { toast } = useToast();

  const templateColumns = DROPDOWN_TEMPLATES[type];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({
            title: "Invalid CSV",
            description: "CSV file must contain headers and at least one data row",
            variant: "destructive"
          });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });

        setCsvData(rows);
        validateData(rows, headers);
        setPreviewMode(true);
      } catch (error) {
        toast({
          title: "Parse Error",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const validateData = (data: any[], headers: string[]) => {
    const errors: BulkUploadError[] = [];
    const requiredFields = templateColumns.map(col => col.field);

    // Check if all required columns are present
    const missingColumns = requiredFields.filter(field => !headers.includes(field));
    if (missingColumns.length > 0) {
      errors.push({
        row: 0,
        field: "Headers",
        value: headers.join(", "),
        error: `Missing required columns: ${missingColumns.join(", ")}`
      });
    }

    // Validate each row
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push({
            row: index + 2, // +2 because row 1 is headers and we're 0-indexed
            field,
            value: row[field] || '',
            error: 'Required field is empty'
          });
        }
      });

    });

    setValidationErrors(errors);
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Errors",
        description: "Please fix validation errors before uploading",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await onUpload(csvData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      
      if (result.failed === 0) {
        toast({
          title: "Upload Successful",
          description: `${result.successful} ${type} uploaded successfully`
        });
      } else {
        toast({
          title: "Upload Completed with Errors",
          description: `${result.successful} successful, ${result.failed} failed`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = templateColumns.map(col => col.field);
    const sampleRow = templateColumns.map(col => col.example);
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: `${type} template downloaded successfully`
    });
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setCsvData([]);
    setPreviewMode(false);
    setUploading(false);
    setUploadProgress(0);
    setValidationErrors([]);
    setUploadResult(null);
  };

  if (!previewMode) {
    return (
      <Card className="shadow-soft border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {title}
          </CardTitle>
          <CardDescription>
            Upload {type} data via CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Requirements */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Format Requirements:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {templateColumns.map((col, index) => (
                <div key={index} className="flex justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{col.field}:</span>
                  <span className="text-foreground-muted">{col.example}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Template Download */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label htmlFor="file-upload" className="block">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <FileText className="w-8 h-8 mx-auto mb-2 text-foreground-muted" />
                <p className="text-sm font-medium">Click to upload CSV file</p>
                <p className="text-xs text-foreground-muted">or drag and drop</p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Preview & Upload
            </CardTitle>
            <CardDescription>
              {selectedFile?.name} - {csvData.length} rows
            </CardDescription>
          </div>
          <Badge variant={validationErrors.length === 0 ? "secondary" : "destructive"}>
            {validationErrors.length === 0 ? "Valid" : `${validationErrors.length} errors`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Validation Errors:</p>
                {validationErrors.slice(0, 5).map((error, index) => (
                  <p key={index} className="text-sm">
                    Row {error.row}, {error.field}: {error.error}
                  </p>
                ))}
                {validationErrors.length > 5 && (
                  <p className="text-sm">... and {validationErrors.length - 5} more errors</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Data Preview */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted p-2">
            <h4 className="font-medium text-sm">Data Preview (first 5 rows)</h4>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border">
                <tr>
                  {templateColumns.map((col) => (
                    <th key={col.field} className="text-left p-2 font-medium">
                      {col.field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-border">
                    {templateColumns.map((col) => (
                      <td key={col.field} className="p-2">
                        {row[col.field]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <Alert variant={uploadResult.failed === 0 ? "default" : "destructive"}>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Upload completed: {uploadResult.successful} successful, {uploadResult.failed} failed
              {uploadResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadResult.errors.slice(0, 3).map((error, index) => (
                    <p key={index} className="text-sm">
                      Row {error.row}: {error.error}
                    </p>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!uploading && !uploadResult && (
            <Button 
              onClick={handleUpload}
              disabled={validationErrors.length > 0}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </Button>
          )}
          
          <Button variant="outline" onClick={resetUpload}>
            {uploadResult ? (
              <RefreshCw className="w-4 h-4 mr-2" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            {uploadResult ? "Upload Another" : "Choose Different File"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};