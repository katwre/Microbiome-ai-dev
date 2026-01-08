#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

if ! [ "mitochondria,chloroplast" = "none" ]; then
    qiime taxa filter-table \
        --i-table table.qza \
        --i-taxonomy taxonomy.qza \
        --p-exclude "mitochondria,chloroplast" \
        --p-mode contains \
        --o-filtered-table tax_filtered-table.qza
    filtered_table="tax_filtered-table.qza"
else
    filtered_table=table.qza
fi

qiime feature-table filter-features \
    --i-table $filtered_table \
    --p-min-frequency 10 \
    --p-min-samples 2 \
    --o-filtered-table filtered-table.qza

#produce raw count table in biom format "table/feature-table.biom"
qiime tools export \
    --input-path filtered-table.qza  \
    --output-path table
#produce raw count table
biom convert \
    -i table/feature-table.biom \
    -o table/feature-table.tsv  \
    --to-tsv
cp table/feature-table.tsv filtered-table.tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_TABLEFILTERTAXA":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
