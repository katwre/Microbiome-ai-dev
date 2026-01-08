#!/usr/bin/env bash -C -e -u -o pipefail
multiqc \
    --force \
     \
    --config multiqc_config.yml \
     \
     \
     \
     \
     \
    .

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:MULTIQC":
    multiqc: $( multiqc --version | sed -e "s/multiqc, version //g" )
END_VERSIONS
