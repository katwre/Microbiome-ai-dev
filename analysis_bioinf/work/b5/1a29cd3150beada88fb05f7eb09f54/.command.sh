#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"
mkdir beta_diversity

qiime emperor plot \
    --i-pcoa jaccard_pcoa_results.qza \
    --m-metadata-file Metadata.tsv \
    --o-visualization jaccard_pcoa_results-vis.qzv
qiime tools export \
    --input-path jaccard_pcoa_results-vis.qzv         --output-path beta_diversity/jaccard_pcoa_results-PCoA

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_DIVERSITY_BETAORD":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
