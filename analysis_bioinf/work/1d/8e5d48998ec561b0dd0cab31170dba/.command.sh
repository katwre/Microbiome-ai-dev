#!/usr/bin/env bash -C -e -u -o pipefail
export XDG_CONFIG_HOME="./xdgconfig"
export MPLCONFIGDIR="./mplconfigdir"
export NUMBA_CACHE_DIR="./numbacache"

#produce raw count table in biom format "table/feature-table.biom"
qiime tools export \
    --input-path filtered-table.qza \
    --output-path table
cp table/feature-table.biom .

#produce raw count table "table/feature-table.tsv"
biom convert \
    -i table/feature-table.biom \
    -o feature-table.tsv \
    --to-tsv

#produce representative sequence fasta file "sequences.fasta"
qiime feature-table tabulate-seqs \
    --i-data filtered-sequences.qza \
    --o-visualization rep-seqs.qzv
qiime tools export \
    --input-path rep-seqs.qzv \
    --output-path representative_sequences
cp representative_sequences/sequences.fasta rep-seq.fasta
cp representative_sequences/*.tsv .

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
    #export to biom
    qiime tools export \
        --input-path table-$i.qza \
        --output-path table-$i
    #convert to tab separated text file
    biom convert \
        -i table-$i/feature-table.biom \
        -o abs-abund-table-$i.tsv --to-tsv
done

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_EXPORT:QIIME2_EXPORT_ABSOLUTE":
    qiime2: $( qiime --version | sed '1!d;s/.* //' )
END_VERSIONS
