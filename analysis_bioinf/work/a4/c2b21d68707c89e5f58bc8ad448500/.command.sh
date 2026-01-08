#!/usr/bin/env Rscript
suppressPackageStartupMessages(library(dada2))

#combine filter_and_trim files
for (data in list.files("./filter_and_trim_files", full.names=TRUE)){
    if (!exists("filter_and_trim")){ filter_and_trim <- read.csv(data, header=TRUE, sep="\t") }
    if (exists("filter_and_trim")){
        tempory <-read.csv(data, header=TRUE, sep="\t")
        filter_and_trim <-unique(rbind(filter_and_trim, tempory))
        rm(tempory)
    }
}
rownames(filter_and_trim) <- filter_and_trim$ID
filter_and_trim["ID"] <- NULL
#write.table( filter_and_trim, file = "1.filter_and_trim.tsv", sep = "\t", row.names = TRUE, quote = FALSE, na = '')

#read data
dadaFs = readRDS("1_1.dada.rds")
dadaRs = readRDS("1_2.dada.rds")
mergers = readRDS("1.mergers.rds")
nochim = readRDS("1.ASVtable.rds")

#track reads through pipeline
getN <- function(x) sum(getUniques(x))
if ( nrow(filter_and_trim) == 1 ) {
    track <- cbind(filter_and_trim, getN(dadaFs), getN(dadaRs), getN(mergers), rowSums(nochim))
} else {
    dadaFs_getN <- data.frame( sapply(dadaFs, getN) )
    dadaRs_getN <- data.frame( sapply(dadaRs, getN) )
    mergers_getN <- data.frame( sapply(mergers, getN) )
    nochim_rowSums <- data.frame( rowSums(nochim) )
    track <- cbind(
        filter_and_trim[order(rownames(filter_and_trim)), ],
        dadaFs_getN[order(rownames(dadaFs_getN)), ],
        dadaRs_getN[order(rownames(dadaRs_getN)), ],
        mergers_getN[order(rownames(mergers_getN)), ],
        nochim_rowSums[order(rownames(nochim_rowSums)), ] )
}
colnames(track) <- c("DADA2_input", "filtered", "denoisedF", "denoisedR", "merged", "nonchim")
rownames(track) <- sub(pattern = "_1.fastq.gz$", replacement = "", rownames(track)) #this is when cutadapt is skipped!
track <- cbind(sample = sub(pattern = "(.*?)\\..*$", replacement = "\\1", rownames(track)), track)
write.table( track, file = "1.stats.tsv", sep = "\t", row.names = FALSE, quote = FALSE, na = '')

writeLines(c("\"NFCORE_AMPLISEQ:AMPLISEQ:DADA2_STATS\":", paste0("    R: ", paste0(R.Version()[c("major","minor")], collapse = ".")),paste0("    dada2: ", packageVersion("dada2")) ), "versions.yml")
