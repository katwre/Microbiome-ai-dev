#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime feature-table filter-samples \
    --i-table "table.qza" \
    --m-metadata-file "Metadata.tsv" \
    --p-where "badpairwise10<>''" \
    --o-filtered-table "filtered_badpairwise10.qza"

qiime feature-table group \
    --i-table "filtered_badpairwise10.qza" \
    --p-axis 'sample' \
    --m-metadata-file "Metadata.tsv" \
    --m-metadata-column "badpairwise10" \
    --p-mode 'sum' \
    --o-grouped-table "badpairwise10"

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_BARPLOTAVG:QIIME2_FEATURETABLE_GROUP":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
