#!/usr/bin/env bash -C -e -u -o pipefail
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

# remove first line if needed
sed '/^# Constructed from biom file/d' "rel-table-ASV.tsv" > biom-table.txt

# load into QIIME2
biom convert -i biom-table.txt -o table.biom --table-type="OTU table" --to-hdf5
qiime tools import \
    --input-path table.biom \
    --type 'FeatureTable[Frequency]' \
    --input-format BIOMV210Format \
    --output-path table.qza

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_BARPLOTAVG:QIIME2_INASV_BPAVG":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
