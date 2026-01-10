import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Mail, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { API_ENDPOINTS } from "@/lib/api";

interface UploadedFile {
  name: string;
  size: number;
}

interface FormState {
  projectName: string;
  email: string;
  dataType: "single-end" | "paired-end";
  files: UploadedFile[];
  sendEmail: boolean;
  useTestData: boolean;
}

interface FormErrors {
  projectName?: string;
  email?: string;
  files?: string;
}

interface SubmittedState {
  jobId: string;
  status: string;
}

const UploadForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    projectName: "",
    email: "",
    dataType: "single-end",
    files: [],
    sendEmail: true,
    useTestData: false,
  });
  const [actualFiles, setActualFiles] = useState<File[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Skip file validation if using test data
    if (!form.useTestData) {
      if (form.files.length === 0) {
        newErrors.files = "Please upload at least one FASTQ file";
      } else if (form.dataType === "single-end" && form.files.length !== 1) {
        newErrors.files = "Single-end sequencing requires exactly 1 FASTQ file";
      } else if (form.dataType === "paired-end" && form.files.length !== 2) {
        newErrors.files = "Paired-end sequencing requires exactly 2 FASTQ files (R1 and R2)";
      } else if (form.dataType === "paired-end" && form.files.length === 2) {
        // Check if we have both R1 and R2
        const types = actualFiles.map(f => detectReadType(f.name));
        const hasR1 = types.includes('R1');
        const hasR2 = types.includes('R2');
        if (!hasR1 || !hasR2) {
          newErrors.files = "Paired-end files must include R1 (forward) and R2 (reverse) reads. Check your filenames contain _R1/_R2, _1/_2, or _F/_R.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const sortedFiles = sortPairedFiles(droppedFiles);
    const fileMetadata = sortedFiles.map((file) => ({
      name: file.name,
      size: file.size,
    }));

    setForm((prev) => ({
      ...prev,
      files: [...prev.files, ...fileMetadata],
    }));
    
    setActualFiles(prev => [...prev, ...sortedFiles]);
    setErrors((prev) => ({ ...prev, files: undefined }));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const sortedFiles = sortPairedFiles(selectedFiles);
      
      setForm((prev) => ({
        ...prev,
        files: [...prev.files, ...sortedFiles.map(f => ({ name: f.name, size: f.size }))],
      }));
      
      setActualFiles(prev => [...prev, ...sortedFiles]);
      setErrors((prev) => ({ ...prev, files: undefined }));
    }
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
    setActualFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const detectReadType = (filename: string): 'R1' | 'R2' | 'unknown' => {
    const name = filename.toLowerCase();
    // Check for R1/R2, _1/_2, _F/_R patterns
    if (name.includes('_r1') || name.includes('_1') || name.includes('_f') || name.includes('_forward')) return 'R1';
    if (name.includes('_r2') || name.includes('_2') || name.includes('_r') || name.includes('_reverse')) return 'R2';
    return 'unknown';
  };

  const sortPairedFiles = (files: File[]): File[] => {
    if (files.length !== 2) return files;
    const sorted = [...files].sort((a, b) => {
      const typeA = detectReadType(a.name);
      const typeB = detectReadType(b.name);
      if (typeA === 'R1' && typeB === 'R2') return -1;
      if (typeA === 'R2' && typeB === 'R1') return 1;
      return 0;
    });
    return sorted;
  };

  const generateJobId = () => {
    return "MRB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('project_name', form.projectName);
      formData.append('email', form.email);
      formData.append('data_type', form.dataType);
      formData.append('send_email', form.sendEmail.toString());
      formData.append('use_test_data', form.useTestData.toString());
      
      // Add actual file objects from state (only if not using test data)
      if (!form.useTestData) {
        actualFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      // Call Django API
      const response = await fetch(API_ENDPOINTS.JOBS_UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      setIsSubmitting(false);
      setSubmitted({
        jobId: data.job_id,
        status: data.status,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setIsSubmitting(false);
      setErrors({ files: error instanceof Error ? error.message : 'Upload failed. Please try again.' });
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setForm({
      projectName: "",
      email: "",
      dataType: "single-end",
      files: [],
      sendEmail: true,
      useTestData: false,
    });
    setActualFiles([]);
    setErrors({});
  };

  if (submitted) {
    return (
      <div className="card-gradient rounded-2xl border border-border p-8 shadow-xl animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-foreground">Analysis Submitted!</h3>
          <p className="mb-6 text-muted-foreground">
            Your microbiome data is now being processed.
          </p>

          <div className="mb-6 rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Job ID</span>
              <span className="font-mono font-semibold text-foreground">{submitted.jobId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="flex items-center gap-2 font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
                {submitted.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button 
              className="btn-gradient"
              onClick={() => navigate(`/jobs/${submitted.jobId}`)}
            >
              Track status
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Submit another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      id="upload-form"
      name="microbiome-upload"
      className="card-gradient rounded-2xl border border-border p-6 shadow-xl sm:p-8 animate-fade-in"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Start your analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your microbiome data and get a comprehensive report
        </p>
      </div>

      <div className="space-y-5">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name *</Label>
          <Input
            id="project-name"
            name="project_name"
            placeholder="e.g., Gut microbiome study 2024"
            value={form.projectName}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, projectName: e.target.value }));
              if (errors.projectName) setErrors((prev) => ({ ...prev, projectName: undefined }));
            }}
            className={errors.projectName ? "border-destructive" : ""}
          />
          {errors.projectName && (
            <p className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.projectName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="researcher@university.edu"
            value={form.email}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, email: e.target.value }));
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Data Type */}
        <div className="space-y-3">
          <Label>Sequencing Type</Label>
          <RadioGroup
            value={form.dataType}
            onValueChange={(value: "single-end" | "paired-end") =>
              setForm((prev) => ({ ...prev, dataType: value }))
            }
            className="flex gap-4"
            name="data_type"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single-end" id="single-end" />
              <Label htmlFor="single-end" className="cursor-pointer font-normal">
                Single-end (1 FASTQ file)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paired-end" id="paired-end" />
              <Label htmlFor="paired-end" className="cursor-pointer font-normal">
                Paired-end (2 FASTQ files)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Test Data Option */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="use-test-data"
              checked={form.useTestData}
              onCheckedChange={(checked) => {
                setForm((prev) => ({ 
                  ...prev, 
                  useTestData: checked as boolean,
                  dataType: checked ? "paired-end" : prev.dataType,
                  files: checked ? [] : prev.files
                }));
                if (checked) {
                  setActualFiles([]);
                  setErrors((prev) => ({ ...prev, files: undefined }));
                }
              }}
            />
            <Label htmlFor="use-test-data" className="cursor-pointer font-normal">
              Use test data (nf-core demo files: 1a_S103_L001_R1/R2_001.fastq.gz)
            </Label>
          </div>
          {form.useTestData && (
            <p className="text-sm text-muted-foreground pl-6">
              ✓ Test data will be used - no file upload needed. Analysis completes in ~5 minutes.
            </p>
          )}
        </div>

        {/* File Upload */}
        {!form.useTestData && (
          <div className="space-y-2">
            <Label>Upload Files *</Label>
            <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`upload-zone cursor-pointer ${isDragging ? "upload-zone-active" : ""} ${
              errors.files ? "border-destructive" : ""
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              type="file"
              id="file-input"
              name="files"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept=".fastq.gz,.fq.gz"
            />
            <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium text-foreground">
              Drag & drop FASTQ files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {form.dataType === "single-end"
                ? "Upload 1 FASTQ file (.fastq.gz or .fq.gz)"
                : "Upload 2 FASTQ files - R1 and R2 (.fastq.gz or .fq.gz)"}
            </p>
          </div>
          {errors.files && (
            <p className="flex items-center gap-1 text-sm text-destructive">
              <AlertCircle className="h-3 w-3" />
              {errors.files}
            </p>
          )}

          {/* File List */}
          {form.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {form.files.map((file, index) => {
                const readType = actualFiles[index] ? detectReadType(actualFiles[index].name) : 'unknown';
                const showBadge = form.dataType === "paired-end" && readType !== 'unknown';
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                      {showBadge && (
                        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                          readType === 'R1' 
                            ? 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300' 
                            : 'bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300'
                        }`}>
                          {readType}
                        </span>
                      )}
                      <span className="truncate text-sm text-foreground">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Email Notification */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="send-email"
            name="send_email"
            checked={form.sendEmail}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, sendEmail: checked as boolean }))
            }
          />
          <Label htmlFor="send-email" className="cursor-pointer font-normal">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Send me email when the report is ready
            </span>
          </Label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            className="btn-gradient w-full text-primary-foreground"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Run analysis"
            )}
          </Button>
        </div>

        {/* View Example */}
        <div className="text-center">
          <a
            href="#example"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View example report
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-muted-foreground">
          Supported formats: TSV, TXT, QZA, QZV • Files are deleted after 30 days
        </p>
      </div>
    </form>
  );
};

export default UploadForm;
