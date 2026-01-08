#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

# Sum data at the specified level
qiime taxa collapse \
    --i-table "treatment1.qza" \
    --i-taxonomy "taxonomy.qza" \
    --p-level 3 \
    --o-collapsed-table "lvl3-treatment1.qza"

# Extract summarised table and output a file with the number of taxa
qiime tools export \
    --input-path "lvl3-treatment1.qza" \
    --output-path exported/
biom convert \
    -i exported/feature-table.biom \
    -o "lvl3-treatment1.feature-table.tsv" \
    --to-tsv

if [ $(grep -v '^#' -c "lvl3-treatment1.feature-table.tsv") -lt 2 ]; then
    mkdir differentials
    echo 3 > differentials/"WARNING Summing your data at taxonomic level 3 produced less than two rows (taxa), ANCOMBC can't proceed -- did you specify a bad reference taxonomy?".txt
    mkdir da_barplot
    echo 3 > da_barplot/"WARNING Summing your data at taxonomic level 3 produced less than two rows (taxa), ANCOMBC can't proceed -- did you specify a bad reference taxonomy?".txt
else
    qiime composition ancombc \
        --i-table "lvl3-treatment1.qza" \
        --m-metadata-file "Metadata.tsv" \
        --p-prv-cut 0.1 --p-lib-cut 500 --p-alpha 0.05 --p-conserve \
        --p-formula 'treatment1' \
        --o-differentials "lvl3-treatment1.differentials.qza" \
        --verbose
    qiime tools export \
        --input-path "lvl3-treatment1.differentials.qza" \
        --output-path "differentials/Category-treatment1-level-3"

    # Generate tabular view of ANCOM-BC output
    qiime composition tabulate \
        --i-data "lvl3-treatment1.differentials.qza" \
        --o-visualization "lvl3-treatment1.differentials.qzv"
    qiime tools export \
        --input-path "lvl3-treatment1.differentials.qzv" \
        --output-path "differentials/Category-treatment1-level-3"

    # Generate bar plot views of ANCOM-BC output
    qiime composition da-barplot \
        --i-data "lvl3-treatment1.differentials.qza" \
        --p-effect-size-threshold 2 --p-significance-threshold 0.00001 --p-label-limit 1000 \
        --o-visualization "lvl3-treatment1.da_barplot.qzv"
    qiime tools export --input-path "lvl3-treatment1.da_barplot.qzv" \
        --output-path "da_barplot/Category-treatment1-level-3"
fi

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_ANCOM:QIIME2_ANCOMBC_TAX":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
