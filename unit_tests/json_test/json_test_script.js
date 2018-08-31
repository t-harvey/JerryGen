var x = new call_callback;
var y = function(x) { print("JSON value: " + x);};
x.call_it(1, y);
x.call_it(2.0, y);
x.call_it("three", y);
print("************************ LAST CALL ******************");
