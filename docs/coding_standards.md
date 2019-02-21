# Coding Standards for JerryGen

The design of JerryGen is to support multiple interpreters and
multiple scripting languages.  Because no two projects share the same
set of coding standards, it would be impossible to conform to one set
of coding standards without violating another set.

Thus, we will specify only a minimal set of standards that make sense
to us.  They apply to the code that makes up this project and the code
that this project produces.

The first rule is that the code must be readable:
<ol>
<li>
<p>Code should be self-documenting</p>
</pre>variable names should reflect purpose</pre>
</li>
<li>
<p>Clear, Consise Comments</p>
<pre>self-documenting code cannot explain the richness of detail that
the programmer has in his head</pre>
<pre>a maintainer should not have to de-code an entire routine to
understand an isolated section of that code</pre>
<pre>code should be largely understood from the comments, with actual
code simply filling in the gaps</pre>
</li>
</ol>
