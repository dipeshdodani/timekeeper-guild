import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, AlertTriangle, CheckCircle, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface BulkUploadProps {
  title: string;
  templateColumns: string[];
  sampleData?: Record<string, string>[];
  onUpload: (data: Record<string, string>[]) => Promise<BulkUploadResult>;
  onClose: () => void;
  validationRules?: Record<string, (value: string, row: Record<string, string>) => string | null>;
}

const BulkUpload = ({ 
  title, 
  templateColumns, 
  sampleData = [], 
  onUpload, 
  onClose, 
  validationRules = {} 
}: BulkUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [errors, setErrors] = useState<BulkUploadError[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
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
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      setCsvData(data);
      setPreviewMode(true);
      validateData(data);
    };
    reader.readAsText(file);
  };

  const validateData = (data: Record<string, string>[]) => {
    const validationErrors: BulkUploadError[] = [];

    data.forEach((row, index) => {
      // Check required fields
      templateColumns.forEach(column => {
        if (!row[column] || row[column].trim() === '') {
          validationErrors.push({
            row: index + 1,
            field: column,
            value: row[column] || '',
            error: `${column} is required`
          });
        }
      });

      // Apply custom validation rules
      Object.entries(validationRules).forEach(([field, validator]) => {
        if (row[field]) {
          const error = validator(row[field], row);
          if (error) {
            validationErrors.push({
              row: index + 1,
              field,
              value: row[field],
              error
            });
          }
        }
      });
    });

    setErrors(validationErrors);
  };

  const handleUpload = async () => {
    if (errors.length > 0) {
      toast({
        title: "Validation Errors",
        description: "Please fix all validation errors before uploading",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
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
          description: `${result.successful} records uploaded successfully`
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
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      templateColumns.join(','),
      ...sampleData.map(row => templateColumns.map(col => row[col] || '').join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-medium border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {!previewMode ? (
          <>
            {/* Template Download */}
            <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
              <div>
                <h3 className="font-semibold">Download Template</h3>
                <p className="text-sm text-foreground-muted">
                  Download the CSV template with sample data to get started
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted mb-4">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Data Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Data Preview</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">{csvData.length} rows</Badge>
                  {errors.length > 0 && (
                    <Badge variant="destructive">{errors.length} errors</Badge>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Found {errors.length} validation error(s). Please fix these issues before uploading.
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-12 p-2 text-left">#</th>
                        {templateColumns.map(column => (
                          <th key={column} className="p-2 text-left font-semibold">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2 text-foreground-muted">{index + 1}</td>
                          {templateColumns.map(column => (
                            <td key={column} className="p-2">
                              {row[column] || <span className="text-foreground-muted">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {csvData.length > 10 && (
                <p className="text-sm text-foreground-muted">
                  Showing first 10 rows of {csvData.length} total rows
                </p>
              )}
            </div>

            {/* Error Details */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">Validation Errors</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-destructive/10 rounded">
                      Row {error.row}, {error.field}: {error.error}
                    </div>
                  ))}
                </div>
                {errors.length > 10 && (
                  <p className="text-sm text-foreground-muted">
                    And {errors.length - 10} more errors...
                  </p>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Alert variant={uploadResult.failed === 0 ? "default" : "destructive"}>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Upload completed: {uploadResult.successful} successful, {uploadResult.failed} failed
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || errors.length > 0}
                className="bg-primary hover:bg-primary/90"
              >
                {isUploading ? "Uploading..." : "Upload Data"}
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Choose Different File
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkUpload;