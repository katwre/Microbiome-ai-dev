#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime diversity adonis \
    --p-n-jobs 2 \
    --i-distance-matrix weighted_unifrac_distance_matrix.qza \
    --m-metadata-file Metadata.tsv \
    --o-visualization weighted_unifrac_distance_matrix_adonis.qzv \
     \
    --p-formula "mix8"
qiime tools export \
    --input-path weighted_unifrac_distance_matrix_adonis.qzv \
    --output-path adonis/weighted_unifrac_distance_matrix-mix8

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_DIVERSITY_ADONIS":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
