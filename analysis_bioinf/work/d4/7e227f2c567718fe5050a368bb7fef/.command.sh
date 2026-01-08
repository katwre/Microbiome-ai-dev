#!/usr/bin/env bash -C -e -u -o pipefail
# FIX: detecting a viable GPU on your system, but the GPU is unavailable for compute, causing UniFrac to fail.
# COMMENT: might be fixed in version after QIIME2 2023.5
export UNIFRAC_USE_GPU=N

export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

mindepth=$(count_table_minmax_reads.py filtered-table.tsv minimum 2>&1)
if [ "$mindepth" -lt "500" ]; then mindepth=500; fi

# report the rarefaction depth and return warning, if needed
if [ "$mindepth" -lt "1000" ]; then
    echo $mindepth >"WARNING The sampling depth of $mindepth seems too small for rarefaction.txt"
elif [ "$mindepth" -lt "5000" ]; then
    echo $mindepth >"WARNING The sampling depth of $mindepth is very small for rarefaction.txt"
elif [ "$mindepth" -lt "10000" ]; then
    echo $mindepth >"WARNING The sampling depth of $mindepth is quite small for rarefaction.txt"
else
    echo $mindepth >"Use the sampling depth of $mindepth for rarefaction.txt"
fi

qiime diversity core-metrics-phylogenetic \
    --m-metadata-file Metadata.tsv \
    --i-phylogeny rooted-tree.qza \
    --i-table filtered-table.qza \
    --p-sampling-depth $mindepth \
    --output-dir diversity_core \
    --p-n-jobs-or-threads 2 \
    --verbose

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_DIVERSITY_CORE":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
