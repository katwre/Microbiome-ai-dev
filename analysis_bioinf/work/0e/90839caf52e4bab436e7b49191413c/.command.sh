#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime feature-table filter-samples \
    --i-table filtered-table.qza \
    --m-metadata-file Metadata.tsv \
    --p-where 'badpairwise10<>""' --p-min-frequency 1 \
    --o-filtered-table badpairwise10.qza

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_ANCOM:QIIME2_FILTERSAMPLES_ANCOM":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
