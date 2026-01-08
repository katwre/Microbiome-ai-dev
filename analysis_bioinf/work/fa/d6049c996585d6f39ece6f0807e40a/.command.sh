#!/usr/bin/env bash -C -e -u -o pipefail
metadata_all.r Metadata.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:METADATA_ALL":
    R: $(R --version 2>&1 | sed -n 1p | sed 's/R version //' | sed 's/ (.*//')
END_VERSIONS
