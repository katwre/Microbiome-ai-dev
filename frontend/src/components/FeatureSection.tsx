import { BarChart3, GitBranch, Layers, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Alpha Diversity",
    description:
      "Shannon, Simpson, and observed species indices with rarefaction curves and statistical comparisons.",
  },
  {
    icon: GitBranch,
    title: "Beta Diversity",
    description:
      "PCoA ordination plots using Bray-Curtis, UniFrac, and Jaccard distances with PERMANOVA tests.",
  },
  {
    icon: Layers,
    title: "Taxonomic Composition",
    description:
      "Interactive stacked bar plots at all taxonomic levels with differential abundance analysis.",
  },
  {
    icon: ShieldCheck,
    title: "QC Summary",
    description:
      "Read counts, filtering statistics, and sample quality metrics to ensure data integrity.",
  },
];

const FeatureSection = () => {
  return (
    <section className="py-16 sm:py-24" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            What you'll get
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A comprehensive microbiome analysis report with publication-ready figures and
            statistical insights.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="feature-tile">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <feature.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
