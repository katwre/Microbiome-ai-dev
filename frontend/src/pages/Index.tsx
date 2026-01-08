import Navbar from "@/components/Navbar";
import UploadForm from "@/components/UploadForm";
import FeatureSection from "@/components/FeatureSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero + Form Section */}
      <section className="hero-gradient py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero Content */}
            <div className="max-w-xl lg:pt-8">
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Analyze your microbiome data in minutes
              </h1>
              <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
                Upload your raw 16S/ITS sequencing data (FASTQ files) and get a comprehensive report with{" "}
                <span className="font-medium text-foreground">alpha diversity</span>,{" "}
                <span className="font-medium text-foreground">beta diversity</span>, and{" "}
                <span className="font-medium text-foreground">taxonomic composition</span>{" "}
                analysis—publication-ready figures included.
              </p>
              <div className="hidden lg:flex lg:items-center lg:gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">No installation required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Results in minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Free for small datasets</span>
                </div>
              </div>
            </div>

            {/* Upload Form */}
            <div className="lg:max-w-md lg:justify-self-end">
              <UploadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <FeatureSection />

      {/* How it Works */}
      <HowItWorksSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
