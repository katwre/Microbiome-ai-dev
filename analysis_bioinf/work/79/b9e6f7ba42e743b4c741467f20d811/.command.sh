#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

#Train classifier
qiime feature-classifier fit-classifier-naive-bayes \
    --i-reference-reads GTGYCAGCMGCCGCGGTAA-GGACTACNVGGGTWTCTAAT-ref-seq.qza \
    --i-reference-taxonomy ref-taxonomy.qza \
    --o-classifier GTGYCAGCMGCCGCGGTAA-GGACTACNVGGGTWTCTAAT-classifier.qza \
    --quiet

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_PREPTAX:QIIME2_TRAIN":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
