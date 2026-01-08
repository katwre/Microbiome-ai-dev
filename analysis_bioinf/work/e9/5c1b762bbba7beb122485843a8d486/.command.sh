#!/usr/bin/env Rscript

    suppressPackageStartupMessages(library(dada2))
    suppressPackageStartupMessages(library(ShortRead))

    readfiles <- sort(list.files(".", pattern = ".fastq.gz", full.names = TRUE))

    #make list of number of sequences
    readfiles_length <- countLines(readfiles) / 4
    sum_readfiles_length <- sum(readfiles_length)

    #use only the first x files when read number gets above 2147483647, read numbers above that do not fit into an INT and crash the process!
    if ( sum_readfiles_length > 2147483647 ) {
        max_files = length(which(cumsum(readfiles_length) <= 2147483647 ))
        write.table(max_files, file = paste0("WARNING Only ",max_files," of ",length(readfiles)," files and ",sum(readfiles_length[1:max_files])," of ",sum_readfiles_length," reads were used for FW plotQualityProfile.txt"), row.names = FALSE, col.names = FALSE, quote = FALSE, na = '')
        readfiles <- readfiles[1:max_files]
    } else {
        max_files <- length(readfiles)
        write.table(max_files, file = paste0(max_files," files were used for FW plotQualityProfile.txt"), row.names = FALSE, col.names = FALSE, quote = FALSE, na = '')
    }

    plot <- plotQualityProfile(readfiles, n = 5e+04, aggregate = TRUE)
    data <- plot$data

    #aggregate data for each sequencing cycle
    df <- data.frame(Cycle=character(), Count=character(), Median=character(), stringsAsFactors=FALSE)
    cycles <- sort(unique(data$Cycle))
    for (cycle in cycles) {
        subdata <- data[data[, "Cycle"] == cycle, ]
        score <- list()
        #convert to list to calculate median
        for (j in 1:nrow(subdata)) {score <- unlist(c(score, rep(subdata$Score[j], subdata$Count[j])))}
        temp = data.frame(Cycle=cycle, Count=sum(subdata$Count), Median=median(score), stringsAsFactors=FALSE)
        df <- rbind(df, temp)
    }

    #write output
    write.table( t(df), file = paste0("FW_qual_stats",".tsv"), sep = "	", row.names = TRUE, col.names = FALSE, quote = FALSE)
    pdf(paste0("FW_qual_stats",".pdf"))
    plot
    dev.off()
    svg(paste0("FW_qual_stats",".svg"))
    plot
    dev.off()

    write.table(paste0('plotQualityProfile	, n = 5e+04, aggregate = TRUE
max_files	',max_files), file = "FW_plotQualityProfile.args.txt", row.names = FALSE, col.names = FALSE, quote = FALSE, na = '')
    writeLines(c("\"NFCORE_AMPLISEQ:AMPLISEQ:DADA2_PREPROCESSING:DADA2_QUALITY1\":", paste0("    R: ", paste0(R.Version()[c("major","minor")], collapse = ".")),paste0("    dada2: ", packageVersion("dada2")),paste0("    ShortRead: ", packageVersion("ShortRead")) ), "versions.yml")
