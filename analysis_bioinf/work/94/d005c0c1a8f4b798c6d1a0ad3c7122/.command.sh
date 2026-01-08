#!/usr/bin/env Rscript

    #load packages
    suppressPackageStartupMessages(library(Biostrings))

    kingdom <- as.list(strsplit("bac", ",")[[1]])

    df = read.table("summary.tsv", header = TRUE, sep = "	", stringsAsFactors = FALSE)
    # keep only ASV_ID & eval columns & sort
    df <- subset(df, select = c(ASV_ID,mito_eval,euk_eval,arc_eval,bac_eval))

    # choose kingdom (column) with lowest evalue
    df[is.na(df)] <- 1
    df$result = colnames(df[,2:5])[apply(df[,2:5],1,which.min)]
    df$result = gsub("_eval", "", df$result)

    # filter ASVs
    df_filtered = subset(df, df$result %in% kingdom)
    id_filtered = subset(df_filtered, select = c(ASV_ID))

    #error if all ASVs are removed
    if ( nrow(df_filtered) == 0 ) stop("Chosen kingdom(s) by --filter_ssu has no matches. Please choose a different kingdom (domain) or omit filtering.")

    #read abundance file, first column is ASV_ID
    table <- read.table(file = 'ASV_post_clustering_filtered.table.tsv', sep = '	', comment.char = '', header=TRUE)
    colnames(table)[1] <- "ASV_ID"

    #read fasta file of ASV sequences
    seq <- readDNAStringSet("ASV_post_clustering_filtered.fna")
    seq <- data.frame(ID=names(seq), sequence=paste(seq))

    #make sure that IDs match, this is only relevant when the fasta is from --input_fasta
    if(!all(id_filtered$ASV_ID %in% seq$ID)) {
        seq$ID <- sub("[[:space:]].*", "",seq$ID)
        if(!all(id_filtered$ASV_ID %in% seq$ID)) { stop(paste("ERROR: Some ASV_IDs are not being merged with sequences, please check
",paste(setdiff(id_filtered$ASV_ID, seq$ID),collapse="
"))) }
    }

    #merge
    filtered_table <- merge(table, id_filtered, by.x="ASV_ID", by.y="ASV_ID", all.x=FALSE, all.y=TRUE)
    filtered_seq <- merge(seq, id_filtered, by.x="ID", by.y="ASV_ID", all.x=FALSE, all.y=TRUE)

    #write
    write.table(filtered_table, file = "ASV_table.ssu.tsv", row.names=FALSE, sep="	", col.names = TRUE, quote = FALSE, na = '')
    write.table(data.frame(s = sprintf(">%s
%s", filtered_seq$ID, filtered_seq$sequence)), 'ASV_seqs.ssu.fasta', col.names = FALSE, row.names = FALSE, quote = FALSE, na = '')

    #stats
    stats <- as.data.frame( t( rbind( colSums(table[-1]), colSums(filtered_table[-1]) ) ) )
    stats$ID <- rownames(stats)
    colnames(stats) <- c("ssufilter_input","ssufilter_output", "sample")
    write.table(stats, file = "stats.ssu.tsv", row.names=FALSE, sep="	")

    writeLines(c("\"NFCORE_AMPLISEQ:AMPLISEQ:FILTER_SSU\":", paste0("    R: ", paste0(R.Version()[c("major","minor")], collapse = ".")),paste0("    Biostrings: ", packageVersion("Biostrings")) ), "versions.yml")
