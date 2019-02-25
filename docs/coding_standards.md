# Coding Standards for JerryGen

The design of JerryGen is to support multiple interpreters and
multiple scripting languages.  Because no two projects share the same
set of coding standards, it would be impossible to conform to one set
of coding standards without violating another set.

Thus, we will specify only a minimal set of mostly philosophical
standards that make sense to us (and are occasionally overstressed,
but only b/c of our deep belief in certain obvious things).  They
apply to the code that makes up this project and the code that this
project produces.

The first and only rule is that the code must be readable:
<ol>
<li>
Code should be simple and self-documenting<br>
    a. use three/four spaces indentation (two spaces can make reading code error prone; five(+) is too many)<br>
    b. functions should end with a comment that is simply the function's name
    c. general good-coding practices apply (e.g., variable names should reflect purpose; use for-loops when iterating through an array, while-loops for linked lists; etc.)<br>
    d. try to be neat, and use whitespace to separate/join ideas; lines should be less than 80 characters, except when that's ugly<br>
    e. strict adherence to every small detail of consistency is not a prerequisite of clarity
</li>
<li>
Clear, Concise, Copious Comments<br>
    a. self-documenting code cannot capture the richness of detail that the programmer has in his head<br>
    b. a maintainer should not have to de-code an entire routine to understand an isolated section of that code<br>
    c. code should be largely understood from the comments, with actual code simply filling in the gaps<br>
</li>
</ol>

99% of the rest of the rules in other systems are superfluous and
usually based on aesthetics -- since we can't get all of the projects
that we want to support to agree on any single set of standards,
specifying any more details than the above is counterproductive.
