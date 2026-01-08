#!/usr/bin/env bash -C -e -u -o pipefail
if [[ 2.15.0 == *dev ]]; then
    ampliseq_version="v2.15.0, revision: bf04a499cc"
else
    ampliseq_version="v2.15.0"
fi

sbdiexportreannotate.R "GTDB R07-RS207 (https://data.gtdb.ecogenomic.org/releases/release207/207.0)" ASV_tax_species.gtdb_R07-RS207.tsv dada2 "$ampliseq_version" none summary.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:SBDIEXPORTREANNOTATE":
    R: $(R --version 2>&1 | sed -n 1p | sed 's/R version //' | sed 's/ (.*//')
END_VERSIONS
