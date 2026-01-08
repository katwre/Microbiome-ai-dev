#!/usr/bin/env bash -C -e -u -o pipefail
vsearch \
    --cluster_smallmem ASV_seqs.fasta \
    --clusters ASV_post_clustering.clusters.fasta \
    --threads 2 \
    --id 0.97 --usersort --qmask 'none'

if [[ --clusters == "--clusters" ]]
then
    find . -type f -name "ASV_post_clustering.clusters.fasta*[0-9]" | xargs gzip -n
elif [[ --clusters != "--samout" ]]
then
    gzip -n ASV_post_clustering.clusters.fasta
else
    samtools view -T ASV_seqs.fasta -S -b ASV_post_clustering.clusters.fasta > ASV_post_clustering.bam
fi

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:VSEARCH_CLUSTER":
    vsearch: $(vsearch --version 2>&1 | head -n 1 | sed 's/vsearch //g' | sed 's/,.*//g' | sed 's/^v//' | sed 's/_.*//')
END_VERSIONS
