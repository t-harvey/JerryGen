var x = new variadic_interface;
x.check_variadic_arrays( [ 1, 2, 3], [4.0, 5.0, 6.0], ["seven", "eight"]);
x.check_any_array( 1, 2.0, "three");
x.check_any_array( );
