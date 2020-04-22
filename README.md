### ePub Info Reader

ePub info reader is a simple callback driven module for reading the meta data of epubs.

`
let reader = require(epub-info-reader);
reader.parseEpub(path, (data) =>{
    console.log(data);
})
`