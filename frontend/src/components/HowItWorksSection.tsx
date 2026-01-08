import { Upload, Cpu, Mail } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description:
      "Upload your feature table and optional metadata. We support QIIME2 artifacts and TSV tables.",
  },
  {
    icon: Cpu,
    title: "Compute",
    description:
      "Our pipeline calculates diversity metrics, generates ordinations, and runs statistical tests.",
  },
  {
    icon: Mail,
    title: "Get report",
    description:
      "Receive an email with a link to your interactive HTML report, ready to explore and share.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="bg-muted/50 py-16 sm:py-24" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">How it works</h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Three simple steps to go from raw data to actionable insights.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="step-card">
                <div className="step-number">{index + 1}</div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Connector line (desktop only) */}
          <div className="relative -mt-16 hidden md:block">
            <div className="absolute left-1/6 right-1/6 top-1/2 h-0.5 bg-border" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
