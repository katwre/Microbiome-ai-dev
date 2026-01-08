#!/usr/bin/env bash -C -e -u -o pipefail
combine_table.r rel-table-ASV.tsv rep-seq.fasta taxonomy.tsv
mv combined_ASV_table.tsv rel-table-ASV_with-QIIME2-tax.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_EXPORT:COMBINE_TABLE_QIIME2":
    R: $(R --version 2>&1 | sed -n 1p | sed 's/R version //' | sed 's/ (.*//')
END_VERSIONS
