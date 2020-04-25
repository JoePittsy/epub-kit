const reader = require("../index");

reader.parseEpub("/home/joe/Downloads/Issac Asimov Foundation Series Complete [EDGE]/Isaac Asimov - Foundation.epub", (err, data) => {
    console.log(data);
})