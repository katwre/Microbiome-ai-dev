#!/usr/bin/env Rscript
suppressPackageStartupMessages(library(dada2))

out <- filterAndTrim("sampleID_1a.trimmed_1.trim.fastq.gz", "sampleID_1a_1.filt.fastq.gz", "sampleID_1a.trimmed_2.trim.fastq.gz", "sampleID_1a_2.filt.fastq.gz",
    truncLen = c(230, 229),
    maxN = 0, trimRight = 0, minQ = 0, rm.lowcomplex = 0, orient.fwd = NULL, matchIDs = FALSE, id.sep = "\\s", id.field = NULL, n = 1e+05, OMP = TRUE,qualityType = "Auto",truncQ = 2,maxEE = c(2, 2),trimLeft = 0, minLen = 50, maxLen = Inf, rm.phix = TRUE,
    compress = TRUE,
    multithread = 4,
    verbose = TRUE)
out <- cbind(out, ID = row.names(out))

# If no reads passed the filter, write an empty GZ file
if(out[2] == '0'){
    for(fp in c("sampleID_1a_1.filt.fastq.gz", "sampleID_1a_2.filt.fastq.gz")){
        print(paste("Writing out an empty file:", fp))
        handle <- gzfile(fp, "w")
        write("", handle)
        close(handle)
    }
}

write.table( out, file = "sampleID_1a.filter_stats.tsv", sep = "\t", row.names = FALSE, quote = FALSE, na = '')
write.table(paste('filterAndTrim	truncLen = c(230, 229)','maxN = 0, trimRight = 0, minQ = 0, rm.lowcomplex = 0, orient.fwd = NULL, matchIDs = FALSE, id.sep = "\\s", id.field = NULL, n = 1e+05, OMP = TRUE,qualityType = "Auto",truncQ = 2,maxEE = c(2, 2),trimLeft = 0, minLen = 50, maxLen = Inf, rm.phix = TRUE',sep=","), file = "filterAndTrim.args.txt", row.names = FALSE, col.names = FALSE, quote = FALSE, na = '')
writeLines(c("\"NFCORE_AMPLISEQ:AMPLISEQ:DADA2_PREPROCESSING:DADA2_FILTNTRIM\":", paste0("    R: ", paste0(R.Version()[c("major","minor")], collapse = ".")),paste0("    dada2: ", packageVersion("dada2")) ), "versions.yml")
