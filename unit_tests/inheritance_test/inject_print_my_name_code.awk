BEGIN {
    target_name = "print_my_name_body";
    need_to_inject = 0;
}

{
    print($0);
    dollar_two_index = index($2, target_name);
    if (index($1, "void") == 1 && dollar_two_index > 0)
    {
	need_to_inject = 1;
	function_name = substr($2, 1, index($2, "(") - length(target_name)-2);
    }
    else if (need_to_inject == 1 && index($0, "USER CODE GOES HERE") > 0)
    {
	need_to_inject = 0;
	printf("printf(\"\\t%s\\n\");", function_name);
    }
}
