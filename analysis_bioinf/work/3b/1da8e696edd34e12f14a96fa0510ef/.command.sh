#!/usr/bin/env bash -C -e -u -o pipefail
[ -f "sampleID_2a_1.fastq.gz" ] || ln -s "2a_S115_L001_R1_001.fastq.gz" "sampleID_2a_1.fastq.gz"
[ -f "sampleID_2a_2.fastq.gz" ] || ln -s "2a_S115_L001_R2_001.fastq.gz" "sampleID_2a_2.fastq.gz"

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:RENAME_RAW_DATA_FILES":
    sed: $(sed --version 2>&1 | sed -n 1p | sed 's/sed (GNU sed) //')
END_VERSIONS
