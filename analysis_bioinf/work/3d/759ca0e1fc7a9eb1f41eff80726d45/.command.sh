#!/usr/bin/env bash -C -e -u -o pipefail
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime tools import \
    --input-path "ASV_seqs.len.fasta" \
    --type 'FeatureData[Sequence]' \
    --output-path rep-seqs.qza

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_INSEQ":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
