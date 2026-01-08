#!/usr/bin/env bash -C -e -u -o pipefail
sbdiexport.R paired GTGYCAGCMGCCGCGGTAA GGACTACNVGGGTWTCTAAT ASV_table.len.tsv ASV_tax_species.gtdb_R07-RS207.tsv Metadata.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:SBDIEXPORT":
    R: $(R --version 2>&1 | sed -n 1p | sed 's/R version //' | sed 's/ (.*//')
END_VERSIONS
