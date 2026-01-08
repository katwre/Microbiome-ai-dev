#!/usr/bin/env bash -C -e -u -o pipefail
combine_table.r rel-table-ASV.tsv rep-seq.fasta ASV_tax_species.gtdb_R07-RS207.tsv
mv combined_ASV_table.tsv rel-table-ASV_with-DADA2-tax.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_EXPORT:COMBINE_TABLE_DADA2":
    R: $(R --version 2>&1 | sed -n 1p | sed 's/R version //' | sed 's/ (.*//')
END_VERSIONS
