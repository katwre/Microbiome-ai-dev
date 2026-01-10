#!/usr/bin/env python3
"""
Create a barplot showing bacteria composition by genus from DADA2 results
"""
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import sys
from pathlib import Path

def create_bacteria_barplot(results_dir, output_file='bacteria_composition.png', top_n=20):
    """
    Create a stacked barplot showing bacteria composition
    
    Args:
        results_dir: Path to results directory containing dada2 folder
        output_file: Output filename for the plot
        top_n: Number of top bacteria to show
    """
    results_path = Path(results_dir)
    
    # Read taxonomy file
    tax_file = results_path / 'dada2' / 'ASV_tax_species.silva_138_2.tsv'
    if not tax_file.exists():
        # Try without species
        tax_file = results_path / 'dada2' / 'ASV_tax.silva_138_2.tsv'
    
    abundance_file = results_path / 'dada2' / 'ASV_table.tsv'
    
    print(f"Reading taxonomy from: {tax_file}")
    print(f"Reading abundance from: {abundance_file}")
    
    # Load data
    taxonomy = pd.read_csv(tax_file, sep='\t')
    abundance = pd.read_csv(abundance_file, sep='\t')
    
    # Merge taxonomy with abundance
    merged = abundance.merge(taxonomy[['ASV_ID', 'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species']], 
                            on='ASV_ID', how='left')
    
    # Get sample columns (everything except ASV_ID and taxonomy)
    sample_cols = [col for col in abundance.columns if col != 'ASV_ID']
    
    # Fill missing taxonomy with "Unclassified"
    merged['Genus'] = merged['Genus'].fillna('Unclassified')
    merged['Family'] = merged['Family'].fillna('Unclassified')
    merged['Phylum'] = merged['Phylum'].fillna('Unclassified')
    
    # Sum abundance by Genus for each sample
    genus_abundance = merged.groupby('Genus')[sample_cols].sum()
    
    # Get top N most abundant genera
    total_abundance = genus_abundance.sum(axis=1).sort_values(ascending=False)
    top_genera = total_abundance.head(top_n).index
    
    # Filter to top genera
    plot_data = genus_abundance.loc[top_genera]
    
    # Sum others
    other_abundance = genus_abundance.loc[~genus_abundance.index.isin(top_genera)].sum()
    if other_abundance.sum() > 0:
        plot_data.loc['Other'] = other_abundance
    
    # Create plot
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Use colorful palette
    colors = sns.color_palette("tab20", n_colors=len(plot_data))
    
    # Create stacked bar plot
    plot_data.T.plot(kind='bar', stacked=True, ax=ax, color=colors, width=0.8)
    
    # Customize plot
    ax.set_xlabel('Sample', fontsize=12, fontweight='bold')
    ax.set_ylabel('Abundance (Read Count)', fontsize=12, fontweight='bold')
    ax.set_title(f'Bacteria Composition by Genus (Top {top_n})', fontsize=14, fontweight='bold')
    ax.legend(title='Genus', bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    # Save plot
    output_path = results_path / output_file
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"\n✓ Plot saved to: {output_path}")
    
    # Also create a genus summary table
    summary_file = results_path / 'bacteria_summary.tsv'
    genus_summary = merged.groupby(['Genus', 'Family', 'Phylum'])[sample_cols].sum()
    genus_summary['Total'] = genus_summary.sum(axis=1)
    genus_summary = genus_summary.sort_values('Total', ascending=False)
    genus_summary.to_csv(summary_file, sep='\t')
    print(f"✓ Summary table saved to: {summary_file}")
    
    # Print top 15 bacteria
    print(f"\n{'='*60}")
    print(f"TOP {min(15, len(genus_summary))} BACTERIA BY ABUNDANCE")
    print(f"{'='*60}")
    print(f"{'Rank':<5} {'Genus':<30} {'Total Reads':<15}")
    print(f"{'-'*60}")
    for i, (idx, row) in enumerate(genus_summary.head(15).iterrows(), 1):
        genus = idx[0] if isinstance(idx, tuple) else idx
        total = int(row['Total'])
        print(f"{i:<5} {genus:<30} {total:<15,}")
    
    return fig, genus_summary

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python create_bacteria_barplot.py <results_directory>")
        print("Example: python create_bacteria_barplot.py /path/to/results")
        sys.exit(1)
    
    results_dir = sys.argv[1]
    create_bacteria_barplot(results_dir)
    print("\n✓ Done!")
