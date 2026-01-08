#!/usr/bin/env Rscript

    #load packages
    suppressPackageStartupMessages(library(Biostrings))

    #read abundance file, first column is ASV_ID
    table <- read.table(file = 'input/ASV_table.ssu.tsv', sep = '	', comment.char = '', header=TRUE)
    colnames(table)[1] <- "ASV_ID"

    #read fasta file of ASV sequences
    input_seq <- readDNAStringSet("input/ASV_seqs.ssu.fasta")
    input_seq <- data.frame(ID=names(input_seq), sequence=paste(input_seq))

    #filter
    filtered_seq <- input_seq[nchar(input_seq$sequence) %in% 1:255,]
    id_list <- filtered_seq[, "ID", drop = FALSE]
    filtered_table <- merge(table, id_list, by.x="ASV_ID", by.y="ID", all.x=FALSE, all.y=TRUE)

    #report
    distribution_before <- table(nchar(input_seq$sequence))
    distribution_before <- data.frame(Length=names(distribution_before),Counts=as.vector(distribution_before))
    distribution_after <- table(nchar(filtered_seq$sequence))
    distribution_after <- data.frame(Length=names(distribution_after),Counts=as.vector(distribution_after))

    #write
    write.table(filtered_table, file = "ASV_table.len.tsv", row.names=FALSE, sep="	", col.names = TRUE, quote = FALSE, na = '')
    write.table(data.frame(s = sprintf(">%s
%s", filtered_seq$ID, filtered_seq$sequence)), 'ASV_seqs.len.fasta', col.names = FALSE, row.names = FALSE, quote = FALSE, na = '')
    write.table(distribution_before, file = "ASV_len_orig.tsv", row.names=FALSE, sep="	", col.names = TRUE, quote = FALSE, na = '')
    write.table(distribution_after, file = "ASV_len_filt.tsv", row.names=FALSE, sep="	", col.names = TRUE, quote = FALSE, na = '')

    #stats
    stats <- as.data.frame( t( rbind( colSums(table[-1]), colSums(filtered_table[-1]) ) ) )
    stats$ID <- rownames(stats)
    colnames(stats) <- c("lenfilter_input","lenfilter_output", "sample")
    write.table(stats, file = "stats.len.tsv", row.names=FALSE, sep="	")

    writeLines(c("\"NFCORE_AMPLISEQ:AMPLISEQ:FILTER_LEN_ASV\":", paste0("    R: ", paste0(R.Version()[c("major","minor")], collapse = ".")),paste0("    Biostrings: ", packageVersion("Biostrings")) ), "versions.yml")
