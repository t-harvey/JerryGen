# WebIDL is buried in each file after a section header announcing that the
#   section is the WebIDL section ("Web IDL"), and then we set up the
#   markdown formatting first with a "<details>" delimiter followed
#   eventually by a "<pre>" delimiter before the actual WebIDL starts, and
#   when we hit the closing "</pre>" delimiter, we are done

BEGIN{
    seen_webidl = 0;
    seen_details = 0;
    seen_pre = 0;
    IGNORECASE = 1;
}

{
    if (length($0) == 0)
	next; # /* for some reason, empty strings mess up index() */

#    /* we don't use "else", here, b/c each of the things we are looking
#       for that may (probably?) mean that we've found a WebIDL section
#       could appear on the same line... */
    if (index($0, "Web IDL") != 0)
	seen_webidl = 1;
    if (seen_webidl && index($0, "<details>") != 0)
	seen_details = 1;
    if (seen_details && index($0, "<pre>") != 0)
	seen_pre = 1;
    if (seen_pre)
    {
#	/* so we have seen "<pre>" on the current line; print out
#	    whatever follows "<pre>" */
	if (index($0, "<pre>") != 0)
	{
	    if (length($0) > length("<pre>"))
	    {
		start = index($0, "<pre>")+length("<pre>");
		print(substr($0, start, length($0)-start+1));
	    }
	}
	else # /* just print the line, but filter out "<p>" */
	{
	    split($0, non_newlines, "<p>");
	    for(i = 1; i <= length(non_newlines); i++)
	    {
		if (index(non_newlines[i], "</pre>") != 0)
		{
#	            /* we've seen the closing "</pre>"; print out anything
#		       on this line that precedes "</pre>" and then reset
#                      all of our flags */
		    if (index(non_newlines[i], "</pre>") != 1)
		    {
			split(non_newlines[i], strip_ending_pre, "</pre>");
			print(strip_ending_pre[1]);
		    }
		    seen_webidl = 0;
		    seen_details = 0;
		    seen_pre = 0;
		    break;
		}
		else if (non_newlines[i] == "Uint8")
		    printf("octet\n");
		else
		    printf("%s\n", non_newlines[i]);
	    }
	}
    }
}
