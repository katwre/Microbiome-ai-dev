#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

##on several taxa level
array=($(seq 2 1 4))

for i in ${array[@]}
do
    #collapse taxa
    qiime taxa collapse \
        --i-table filtered-table.qza \
        --i-taxonomy taxonomy.qza \
        --p-level $i \
        --o-collapsed-table table-$i.qza
    #convert to relative abundances
    qiime feature-table relative-frequency \
        --i-table table-$i.qza \
        --o-relative-frequency-table relative-table-$i.qza
    #export to biom
    qiime tools export \
        --input-path relative-table-$i.qza \
        --output-path relative-table-$i
    #convert to tab separated text file
    biom convert \
        -i relative-table-$i/feature-table.biom \
        -o rel-table-$i.tsv --to-tsv
done

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_EXPORT:QIIME2_EXPORT_RELTAX":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
