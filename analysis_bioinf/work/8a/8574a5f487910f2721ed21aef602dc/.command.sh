#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime diversity beta-group-significance \
    --i-distance-matrix bray_curtis_distance_matrix.qza \
    --m-metadata-file Metadata.tsv \
    --m-metadata-column "mix8" \
    --o-visualization bray_curtis_distance_matrix-mix8.qzv \
    --p-pairwise
qiime tools export \
    --input-path bray_curtis_distance_matrix-mix8.qzv \
    --output-path beta_diversity/bray_curtis_distance_matrix-mix8

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_DIVERSITY_BETA":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
