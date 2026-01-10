import { Dna } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Dna className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Microbiome Report Builder</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
