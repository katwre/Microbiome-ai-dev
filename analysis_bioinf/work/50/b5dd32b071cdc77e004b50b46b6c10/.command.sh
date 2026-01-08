#!/usr/bin/env bash -C -e -u -o pipefail
taxref_reformat_qiime_greengenes85.sh \

#Giving out information
echo -e "--qiime_ref_taxonomy: greengenes85\n" >ref_taxonomy.txt
echo -e "Title: Greengenes 16S - Version 13_8 - clustered at 85% similarity - for testing purposes only\n" >>ref_taxonomy.txt
echo -e "Citation: McDonald, D., Price, M., Goodrich, J. et al. An improved Greengenes taxonomy with explicit ranks for ecological and evolutionary analyses of bacteria and archaea. ISME J 6, 610–618 (2012). https://doi.org/10.1038/ismej.2011.139\n" >>ref_taxonomy.txt
echo "All entries: [title:Greengenes 16S - Version 13_8 - clustered at 85% similarity - for testing purposes only, file:[https://data.qiime2.org/2023.7/tutorials/training-feature-classifiers/85_otus.fasta, https://data.qiime2.org/2023.7/tutorials/training-feature-classifiers/85_otu_taxonomy.txt], citation:McDonald, D., Price, M., Goodrich, J. et al. An improved Greengenes taxonomy with explicit ranks for ecological and evolutionary analyses of bacteria and archaea. ISME J 6, 610–618 (2012). https://doi.org/10.1038/ismej.2011.139, fmtscript:taxref_reformat_qiime_greengenes85.sh]" >>ref_taxonomy.txt

cat <<-END_VERSIONS > versions.yml
"NFCORE_AMPLISEQ:AMPLISEQ:QIIME2_PREPTAX:FORMAT_TAXONOMY_QIIME":
    sed: $(sed --version 2>&1 | sed -n 1p | sed 's/sed (GNU sed) //')
END_VERSIONS
