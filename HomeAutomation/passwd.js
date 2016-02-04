var bcrypt = require('bcryptjs');


bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash("<pass>", salt, function (err, hash) {
        if (err) {
            console.log('Error');
        } else {
            console.log(hash);
        }
    });
});

/*
bcrypt.compare("<pass>", "<hash>", function (err, res) {
    if (err) {
        console.log(err);
    } else {
        console.log(res);
    }
});
*/
