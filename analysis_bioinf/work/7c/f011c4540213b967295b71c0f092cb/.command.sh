#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

qiime alignment mafft \
    --i-sequences filtered-sequences.qza \
    --o-alignment aligned-rep-seqs.qza \
    --p-n-threads 4
qiime alignment mask \
    --i-alignment aligned-rep-seqs.qza \
    --o-masked-alignment masked-aligned-rep-seqs.qza
qiime phylogeny fasttree \
    --i-alignment masked-aligned-rep-seqs.qza \
    --p-n-threads 4 \
    --o-tree unrooted-tree.qza
qiime phylogeny midpoint-root \
    --i-tree unrooted-tree.qza \
    --o-rooted-tree rooted-tree.qza
qiime tools export \
    --input-path rooted-tree.qza  \
    --output-path phylogenetic_tree
cp phylogenetic_tree/tree.nwk .

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_DIVERSITY:QIIME2_TREE":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
