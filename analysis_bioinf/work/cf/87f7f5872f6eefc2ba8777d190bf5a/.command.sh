#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

### Import
qiime tools import \
    --type 'FeatureData[Sequence]' \
    --input-path greengenes85.fna \
    --output-path ref-seq.qza
qiime tools import \
    --type 'FeatureData[Taxonomy]' \
    --input-format HeaderlessTSVTaxonomyFormat \
    --input-path greengenes85.tax \
    --output-path ref-taxonomy.qza
#Extract sequences based on primers
qiime feature-classifier extract-reads \
    --p-n-jobs 4 \
    --i-sequences ref-seq.qza \
    --p-f-primer GTGYCAGCMGCCGCGGTAA \
    --p-r-primer GGACTACNVGGGTWTCTAAT \
     \
    --o-reads GTGYCAGCMGCCGCGGTAA-GGACTACNVGGGTWTCTAAT-ref-seq.qza \
    --quiet

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_PREPTAX:QIIME2_EXTRACT":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
