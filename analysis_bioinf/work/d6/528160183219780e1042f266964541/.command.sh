#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime feature-classifier classify-sklearn  \
    --i-classifier GTGYCAGCMGCCGCGGTAA-GGACTACNVGGGTWTCTAAT-classifier.qza  \
    --p-n-jobs 4  \
    --i-reads rep-seqs.qza  \
    --o-classification taxonomy.qza  \
    --verbose
qiime metadata tabulate  \
    --m-input-file taxonomy.qza  \
    --o-visualization taxonomy.qzv  \
    --verbose
#produce "taxonomy/taxonomy.tsv"
qiime tools export \
    --input-path taxonomy.qza  \
    --output-path taxonomy
qiime tools export \
    --input-path taxonomy.qzv  \
    --output-path taxonomy
cp taxonomy/taxonomy.tsv .

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_TAXONOMY:QIIME2_CLASSIFY":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
