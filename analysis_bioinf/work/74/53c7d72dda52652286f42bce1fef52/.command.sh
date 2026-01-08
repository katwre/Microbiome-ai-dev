#!/usr/bin/env Rscript
x <- read.table("file1.tsv", header = TRUE, sep = "	", stringsAsFactors = FALSE)
y <- read.table("file2.tsv", header = TRUE, sep = "	", stringsAsFactors = FALSE)

#merge
df <- merge(x, y, by = "sample", all = TRUE)

#write
write.table(df, file = "overall_summary.tsv", quote=FALSE, col.names=TRUE, row.names=FALSE, sep="	")

writeLines(c("\"NFCORE_AMPLISEQ:AMPLISEQ:MERGE_STATS_FILTERLENASV\":", paste0("    R: ", paste0(R.Version()[c("major","minor")], collapse = ".")) ), "versions.yml")
