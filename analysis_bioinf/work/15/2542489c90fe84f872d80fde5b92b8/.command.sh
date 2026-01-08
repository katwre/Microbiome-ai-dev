#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime feature-table filter-seqs \
    --i-data rep-seqs.qza \
    --i-table filtered-table.qza \
    --o-filtered-data filtered-sequences.qza

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_SEQFILTERTABLE":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
