const reader = require("../index");

reader.parseEpub("test/city of bones.epub", (err, data) => {
    console.log(data);
});