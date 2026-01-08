#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime composition ancombc \
    --i-table "filtered-table.qza" \
    --m-metadata-file "Metadata.tsv" \
    --p-reference-levels treatment1::b --p-prv-cut 0.1 --p-lib-cut 500 --p-alpha 0.05 --p-conserve \
    --p-formula 'treatment1' \
    --o-differentials "treatment1.differentials.qza" \
    --verbose
qiime tools export \
    --input-path "treatment1.differentials.qza" \
    --output-path "differentials/Category-treatment1-ASV"

# Generate tabular view of ANCOM-BC output
qiime composition tabulate \
    --i-data "treatment1.differentials.qza" \
    --o-visualization "treatment1.differentials.qzv"
qiime tools export \
    --input-path "treatment1.differentials.qzv" \
    --output-path "differentials/Category-treatment1-ASV"

# Generate bar plot views of ANCOM-BC output
qiime composition da-barplot \
    --i-data "treatment1.differentials.qza" \
    --p-effect-size-threshold 2 --p-significance-threshold 0.00001 --p-label-limit 1000 \
    --o-visualization "treatment1.da_barplot.qzv"
qiime tools export --input-path "treatment1.da_barplot.qzv" \
    --output-path "da_barplot/Category-treatment1-ASV"

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_ANCOM:ANCOMBC_FORMULA_ASV":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
