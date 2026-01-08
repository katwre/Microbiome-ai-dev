#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

#convert to relative abundances
qiime feature-table relative-frequency \
    --i-table filtered-table.qza \
    --o-relative-frequency-table relative-table-ASV.qza

#export to biom
qiime tools export \
    --input-path relative-table-ASV.qza \
    --output-path relative-table-ASV

#convert to tab separated text file "rel-table-ASV.tsv"
biom convert \
    -i relative-table-ASV/feature-table.biom \
    -o rel-table-ASV.tsv --to-tsv

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_EXPORT:QIIME2_EXPORT_RELASV":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
