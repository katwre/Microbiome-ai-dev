#!/usr/bin/env bash -C -e -u -o pipefail
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

parse_dada2_taxonomy.r ASV_tax_species.gtdb_R07-RS207.tsv

qiime tools import \
    --type 'FeatureData[Taxonomy]' \
    --input-format HeaderlessTSVTaxonomyFormat \
    --input-path tax.tsv \
    --output-path taxonomy.qza

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_INTAX":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
