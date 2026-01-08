#!/usr/bin/env bash -C -e -u -o pipefail
trunclen.py RV_qual_stats.tsv 25 0.75

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:DADA2_PREPROCESSING:TRUNCLEN":
    python: $(python --version 2>&1 | sed 's/Python //g')
    pandas: $(python -c "import pkg_resources; print(pkg_resources.get_distribution('pandas').version)")
END_VERSIONS
