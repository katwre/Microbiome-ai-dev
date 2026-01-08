#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime diversity alpha-group-significance \
    --i-alpha-diversity faith_pd_vector.qza \
    --m-metadata-file Metadata.tsv \
    --o-visualization faith_pd_vector-vis.qzv
qiime tools export \
    --input-path faith_pd_vector-vis.qzv \
    --output-path "alpha_diversity/faith_pd_vector"

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_DIVERSITY_ALPHA":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
