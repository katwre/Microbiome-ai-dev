#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime diversity beta-group-significance \
    --i-distance-matrix jaccard_distance_matrix.qza \
    --m-metadata-file Metadata.tsv \
    --m-metadata-column "treatment1" \
    --o-visualization jaccard_distance_matrix-treatment1.qzv \
    --p-pairwise
qiime tools export \
    --input-path jaccard_distance_matrix-treatment1.qzv \
    --output-path beta_diversity/jaccard_distance_matrix-treatment1

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_DIVERSITY_BETA":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
