import { useState, useCallback } from "react";
import { Upload, FileText, X, Mail, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface UploadedFile {
  name: string;
  size: number;
}

interface FormState {
  projectName: string;
  email: string;
  dataType: "tsv" | "qiime2";
  files: UploadedFile[];
  sendEmail: boolean;
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
  const [form, setForm] = useState<FormState>({
    projectName: "",
    email: "",
    dataType: "tsv",
    files: [],
    sendEmail: true,
  });

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

    if (form.files.length === 0) {
      newErrors.files = "Please upload at least one file";
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
    
    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      name: file.name,
      size: file.size,
    }));

    setForm((prev) => ({
      ...prev,
      files: [...prev.files, ...droppedFiles],
    }));
    setErrors((prev) => ({ ...prev, files: undefined }));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: file.size,
      }));

      setForm((prev) => ({
        ...prev,
        files: [...prev.files, ...selectedFiles],
      }));
      setErrors((prev) => ({ ...prev, files: undefined }));
    }
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const generateJobId = () => {
    return "MRB-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted({
      jobId: generateJobId(),
      status: "Queued",
    });
  };

  const resetForm = () => {
    setSubmitted(null);
    setForm({
      projectName: "",
      email: "",
      dataType: "tsv",
      files: [],
      sendEmail: true,
    });
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
            <Button className="btn-gradient">
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
          <Label>Data Type</Label>
          <RadioGroup
            value={form.dataType}
            onValueChange={(value: "tsv" | "qiime2") =>
              setForm((prev) => ({ ...prev, dataType: value }))
            }
            className="flex gap-4"
            name="data_type"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tsv" id="tsv" />
              <Label htmlFor="tsv" className="cursor-pointer font-normal">
                TSV tables
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="qiime2" id="qiime2" />
              <Label htmlFor="qiime2" className="cursor-pointer font-normal">
                QIIME2 artifacts
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* File Upload */}
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
              accept=".tsv,.txt,.qza,.qzv"
            />
            <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium text-foreground">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {form.dataType === "tsv"
                ? "Accepts .tsv and .txt files"
                : "Accepts .qza and .qzv files"}
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
              {form.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
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
              ))}
            </div>
          )}
        </div>

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
