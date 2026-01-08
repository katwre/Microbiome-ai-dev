import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2, ArrowLeft, Download, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface JobData {
  job_id: string;
  project_name: string;
  email: string;
  status: string;
  data_type: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  files: Array<{
    file_name: string;
    file_size: number;
    uploaded_at: string;
  }>;
  result?: {
    report_html: string | null;
    alpha_diversity_plot: string | null;
    beta_diversity_plot: string | null;
    taxonomy_plot: string | null;
    execution_time: number | null;
  };
}

const JobStatus = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/`);
      
      if (!response.ok) {
        throw new Error("Job not found");
      }
      
      const data = await response.json();
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobStatus();
    }
  }, [jobId]);

  // Auto-refresh for pending/processing jobs
  useEffect(() => {
    if (job && (job.status === "pending" || job.status === "processing")) {
      const interval = setInterval(fetchJobStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [job?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-8 w-8 text-success" />;
      case "processing":
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
      case "pending":
        return <Clock className="h-8 w-8 text-warning" />;
      case "failed":
        return <XCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "processing":
        return "text-primary";
      case "pending":
        return "text-warning";
      case "failed":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The job you're looking for doesn't exist."}
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          {/* Job Status Card */}
          <Card className="p-6 sm:p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{job.project_name}</h1>
                <p className="text-sm text-muted-foreground">Job ID: {job.job_id}</p>
              </div>
              <div className="flex flex-col items-center">
                {getStatusIcon(job.status)}
                <span className={`mt-2 font-semibold capitalize ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
            </div>

            {/* Job Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{job.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Type</p>
                <p className="font-medium uppercase">{job.data_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(job.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(job.updated_at)}</p>
              </div>
            </div>

            {/* Error Message */}
            {job.status === "failed" && job.error_message && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-destructive mb-1">Error Details:</p>
                <p className="text-sm text-muted-foreground">{job.error_message}</p>
              </div>
            )}

            {/* Processing Status */}
            {(job.status === "pending" || job.status === "processing") && (
              <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-primary mb-1">
                  {job.status === "pending" ? "Queued for Processing" : "Processing Your Data"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your analysis is in progress. This page will automatically update.
                </p>
              </div>
            )}

            {/* Uploaded Files */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Uploaded Files</h3>
              <div className="space-y-2">
                {job.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{file.file_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Section */}
            {job.status === "completed" && job.result && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
                <div className="bg-success/10 border border-success rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-success mb-1">Analysis Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    Your microbiome analysis has finished successfully.
                    {job.result.execution_time && ` Completed in ${job.result.execution_time.toFixed(1)}s`}
                  </p>
                </div>

                {/* Download Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.result.report_html && (
                    <Button variant="default" className="w-full" asChild>
                      <a href={`http://localhost:8000${job.result.report_html}`} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </a>
                    </Button>
                  )}
                  {job.result.alpha_diversity_plot && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`http://localhost:8000${job.result.alpha_diversity_plot}`} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Alpha Diversity Plot
                      </a>
                    </Button>
                  )}
                  {job.result.beta_diversity_plot && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`http://localhost:8000${job.result.beta_diversity_plot}`} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Beta Diversity Plot
                      </a>
                    </Button>
                  )}
                  {job.result.taxonomy_plot && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`http://localhost:8000${job.result.taxonomy_plot}`} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Taxonomy Plot
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JobStatus;
