#!/usr/bin/env bash -C -e -u -o pipefail
filter_stats.py ASV_table.len.tsv filtered-table.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:FILTER_STATS":
    python: $(python --version 2>&1 | sed 's/Python //g')
    pandas: $(python -c "import pkg_resources; print(pkg_resources.get_distribution('pandas').version)")
END_VERSIONS
