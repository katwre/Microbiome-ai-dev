#!/usr/bin/env bash -C -e -u -o pipefail
cutadapt_summary.py paired_end *.cutadapt.log > cutadapt_standard_summary.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:CUTADAPT_WORKFLOW:CUTADAPT_SUMMARY_STD":
    python: $( python --version )
END_VERSIONS
