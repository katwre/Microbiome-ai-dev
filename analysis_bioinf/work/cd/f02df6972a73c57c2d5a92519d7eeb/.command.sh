#!/usr/bin/env bash -C -e -u -o pipefail
cutadapt \
    -Z \
    --cores 4 \
    --minimum-length 1 -O 3 -e 0.1 -g GTGYCAGCMGCCGCGGTAA -G GGACTACNVGGGTWTCTAAT --discard-untrimmed \
    -o sampleID_2a.trimmed_1.trim.fastq.gz -p sampleID_2a.trimmed_2.trim.fastq.gz \
    sampleID_2a_1.fastq.gz sampleID_2a_2.fastq.gz \
    > sampleID_2a.trimmed.cutadapt.log
cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:CUTADAPT_WORKFLOW:CUTADAPT_BASIC":
    cutadapt: $(cutadapt --version)
END_VERSIONS
