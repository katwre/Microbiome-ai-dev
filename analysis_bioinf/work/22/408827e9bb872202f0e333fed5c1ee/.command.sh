#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime taxa barplot  \
    --i-table filtered-table.qza  \
    --i-taxonomy taxonomy.qza  \
    --m-metadata-file Metadata.tsv  \
    --o-visualization taxa-bar-plots.qzv  \
    --verbose
qiime tools export \
    --input-path taxa-bar-plots.qzv  \
    --output-path barplot

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_BARPLOT":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
