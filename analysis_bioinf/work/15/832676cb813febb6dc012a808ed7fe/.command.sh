#!/usr/bin/env bash -C -e -u -o pipefail
printf "%s %s\n" sampleID_1_1.fastq.gz sampleID_1_1.gz sampleID_1_2.fastq.gz sampleID_1_2.gz | while read old_name new_name; do
    [ -f "${new_name}" ] || ln -s $old_name $new_name
done

fastqc \
    --quiet \
    --threads 4 \
    --memory 3840 \
    sampleID_1_1.gz sampleID_1_2.gz

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:FASTQC":
    fastqc: $( fastqc --version | sed '/FastQC v/!d; s/.*v//' )
END_VERSIONS
