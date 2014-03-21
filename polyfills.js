//Taken from http://stackoverflow.com/a/5675579/373655
if (!Object.keys) {
    Object.keys = function(obj) {
        var keys = [],
            k;
        for (k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
        }
        return keys;
    };
}