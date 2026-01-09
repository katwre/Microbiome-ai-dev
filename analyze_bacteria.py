#!/usr/bin/env python3
"""
Create bacteria composition summary from DADA2 results (no external dependencies)
"""
import csv
from collections import defaultdict
from pathlib import Path
import sys

def read_tsv(filepath):
    """Read TSV file into list of dicts"""
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        return list(reader)

def create_bacteria_summary(results_dir):
    """Create bacteria composition summary"""
    results_path = Path(results_dir)
    
    # Read files
    tax_file = results_path / 'dada2' / 'ASV_tax_species.silva_138_2.tsv'
    abundance_file = results_path / 'dada2' / 'ASV_table.tsv'
    
    print(f"Reading: {tax_file}")
    print(f"Reading: {abundance_file}")
    
    taxonomy = {row['ASV_ID']: row for row in read_tsv(tax_file)}
    abundance = read_tsv(abundance_file)
    
    # Get sample columns
    sample_cols = [k for k in abundance[0].keys() if k != 'ASV_ID']
    
    # Sum by genus
    genus_totals = defaultdict(lambda: {sample: 0 for sample in sample_cols})
    genus_totals_overall = defaultdict(int)
    
    for asv_row in abundance:
        asv_id = asv_row['ASV_ID']
        tax = taxonomy.get(asv_id, {})
        genus = tax.get('Genus', 'Unclassified') or 'Unclassified'
        family = tax.get('Family', '') or ''
        phylum = tax.get('Phylum', '') or ''
        
        for sample in sample_cols:
            count = int(asv_row[sample] or 0)
            genus_totals[genus][sample] += count
            genus_totals_overall[genus] += count
    
    # Sort by total abundance
    sorted_genera = sorted(genus_totals_overall.items(), key=lambda x: x[1], reverse=True)
    
    # Create output file
    output_file = results_path / 'bacteria_composition_summary.tsv'
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerow(['Rank', 'Genus', 'Total_Reads'] + sample_cols)
        
        for rank, (genus, total) in enumerate(sorted_genera[:30], 1):
            row = [rank, genus, total]
            for sample in sample_cols:
                row.append(genus_totals[genus][sample])
            writer.writerow(row)
    
    print(f"\n✓ Summary saved to: {output_file}")
    
    # Print top bacteria
    print(f"\n{'='*70}")
    print(f"TOP 20 BACTERIA BY ABUNDANCE")
    print(f"{'='*70}")
    print(f"{'Rank':<6} {'Genus':<35} {'Total Reads':<15} {'% of Total'}")
    print(f"{'-'*70}")
    
    total_all = sum(genus_totals_overall.values())
    for rank, (genus, count) in enumerate(sorted_genera[:20], 1):
        percent = (count / total_all * 100) if total_all > 0 else 0
        print(f"{rank:<6} {genus:<35} {count:<15,} {percent:>6.2f}%")
    
    # Also show readable bacteria names
    print(f"\n{'='*70}")
    print(f"IDENTIFIABLE BACTERIA (Common/Readable Names):")
    print(f"{'='*70}")
    
    readable_count = 0
    for rank, (genus, count) in enumerate(sorted_genera, 1):
        # Filter out alphanumeric codes
        if genus != 'Unclassified' and not any(x in genus for x in ['GCA-', 'UBA', 'CAIVNC', 'CAISUE', 'SHXW', 'JABDBI', 'Gp6-', 'XYD2-', 'MHLP', 'SOKP', 'CSP1-']):
            # Check if it looks like a real genus name (not all caps or numbers)
            if not genus.replace('-', '').replace('_', '').isupper() or any(char.islower() for char in genus):
                readable_count += 1
                percent = (count / total_all * 100) if total_all > 0 else 0
                print(f"{readable_count:2}. {genus:<35} {count:>8,} reads ({percent:>5.2f}%)")
                if readable_count >= 20:
                    break
    
    return output_file

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze_bacteria.py <results_directory>")
        sys.exit(1)
    
    create_bacteria_summary(sys.argv[1])
    print("\n✓ Done!")
