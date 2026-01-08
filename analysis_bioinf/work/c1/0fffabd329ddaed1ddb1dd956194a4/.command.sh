#!/usr/bin/env bash -C -e -u -o pipefail
tail filtered-table.tsv -n +2 | sed '1s/#OTU ID/ASV_ID/' > reformat_filtered-table.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:ROBJECT_WORKFLOW:PHYLOSEQ_INASV":
    sed: $(sed --version 2>&1 | sed -n 1p | sed 's/sed (GNU sed) //')
END_VERSIONS
