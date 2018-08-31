/* this will print out "undefined" if the object doesn't have a particular field */
var print_object = function(name, x) {print(name);    print("\ta = >" + x.a + "<  (" + typeof x.a + ")");    print("\tb = >" + x.b + "<  (" + typeof x.b + ")");    print("\tc = >" + x.c + "<  (" + typeof x.c + ")");    print("\td = >" + x.d + "<  (" + typeof x.d + ")");    print("\te = >" + x.e + "<  (" + typeof x.e + ")");    print("\tf = >" + x.f + "<  (" + typeof x.f + ")");    if (typeof x.print_my_name != "undefined")	x.print_my_name();};


var interface_even_farther_interface_ancestor = new even_farther_interface_ancestor;
var interface_farthest_interface_ancestor = new farthest_interface_ancestor;
var interface_middle_interface_ancestor = new middle_interface_ancestor;
var interface_nearest_interface_ancestor = new nearest_interface_ancestor;
var interface_interface_compilation = new interface_compilation;

var dictionary_even_farther_dictionary_ancestor = new even_farther_dictionary_ancestor;
var dictionary_farthest_dictionary_ancestor = new farthest_dictionary_ancestor;
var dictionary_middle_dictionary_ancestor = new middle_dictionary_ancestor;
var dictionary_nearest_dictionary_ancestor = new nearest_dictionary_ancestor;
var dictionary_dictionary_compilation = new dictionary_compilation;


print_object("interface_even_farther_interface_ancestor", interface_even_farther_interface_ancestor);
print_object("interface_farthest_interface_ancestor", interface_farthest_interface_ancestor);
print_object("interface_middle_interface_ancestor", interface_middle_interface_ancestor);
print_object("interface_nearest_interface_ancestor", interface_nearest_interface_ancestor);
print_object("interface_interface_compilation", interface_interface_compilation);

print_object("dictionary_even_farther_dictionary_ancestor", dictionary_even_farther_dictionary_ancestor);
print_object("dictionary_farthest_interface_ancestor", dictionary_farthest_dictionary_ancestor);
print_object("dictionary_middle_dictionary_ancestor", dictionary_middle_dictionary_ancestor);
print_object("dictionary_nearest_dictionary_ancestor", dictionary_nearest_dictionary_ancestor);
print_object("dictionary_dictionary_compilation", dictionary_dictionary_compilation);

print("******************** LAST CALL ******************");
