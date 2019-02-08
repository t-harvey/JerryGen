BEGIN{
errors_found = 0;
recording = 0;
}

{
if (index($1, "**************************") != 0)
    last_seen = $1;
else if ($1 == "diff" && NF == 3 && index($2, "results") != 0  && index($3, "results") != 0)
    recording = 1;
else if (NF ==2 && $1 == "done" && $2 = "diffing")
{
    if (recording > 1)
    {
	printf "%s\n", last_seen;
	for(i = 1; i < recording; i++)
	    printf "%s\n", diffs[i];
	errors_found++;
    }
    recording = 0;
}
else if (recording > 0)
{
    diffs[recording] = $0;
    recording++;
}

}

END{
if (errors_found == 0)
    print "NO ERRORS.";
else
    printf "%d ERRORS.\n", errors_found;
}
