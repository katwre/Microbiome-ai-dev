#!/usr/bin/env bash -C -e -u -o pipefail
reformat_tax_for_phyloseq.py taxonomy.tsv reformat_taxonomy.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:PHYLOSEQ_INTAX_QIIME2":
    python: $(python --version 2>&1 | sed 's/Python //g')
    pandas: $(python -c "import pkg_resources; print(pkg_resources.get_distribution('pandas').version)")
END_VERSIONS
