#!/usr/bin/env bash -C -e -u -o pipefail
cutadapt \
    -Z \
    --cores 4 \
    --discard-untrimmed --minimum-length 1 -g GTGYCAGCMGCCGCGGTAA...ATTAGAWACCCBNGTAGTCC \
    -o assignTaxonomy.trim.fastq.gz \
    assignTaxonomy.fna \
    > assignTaxonomy.cutadapt.log
cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:DADA2_TAXONOMY_WF:CUTADAPT_TAXONOMY":
    cutadapt: $(cutadapt --version)
END_VERSIONS
