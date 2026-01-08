#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

maxdepth=$(count_table_minmax_reads.py filtered-table.tsv maximum 2>&1)

#check values
if [ "$maxdepth" -gt "75000" ]; then maxdepth="75000"; fi
if [ "$maxdepth" -gt "5000" ]; then maxsteps="250"; else maxsteps=$((maxdepth/20)); fi
qiime diversity alpha-rarefaction  \
    --i-table filtered-table.qza  \
    --i-phylogeny rooted-tree.qza  \
    --p-max-depth $maxdepth  \
    --m-metadata-file Metadata.tsv  \
    --p-steps $maxsteps  \
    --p-iterations 10  \
    --o-visualization alpha-rarefaction.qzv
qiime tools export --input-path alpha-rarefaction.qzv  \
    --output-path alpha-rarefaction

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_ALPHARAREFACTION":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
