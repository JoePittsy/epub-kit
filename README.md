### ePub-kit

ePub-kit is a collection of tools for working with epubs.

## Installation

```npm install epub-kit```

Or, to install globally:

```npm install -g epub-kit```

## Usage
```javascript
const Book = require("epub-kit");
let myEpub = new Book("/path/to/my/book.epub");
myEpub.read()
.then(data => {
    // work with data
});

let info = myEpub.getData(["author", "title"]);
console.log(info) -> {"author": "Andy Weir", "title": "The Martian"}

```
Where data is an object with the following fields.

| Field         | Data Type          | Example        |
| ------------- |--------------------| ---------------|
| title         |string  |The Martian     |
| identifier    |string |9781101905005   |
| language      |string  |en              |
| creator       |string or undefined |Andy Weir       |
| contributor   |string or undefined |Eric White      |
| coverage      |string or undefined |London          |
| date          |string or undefined |2000-01-01T00:00:00Z            |
| description   |string or undefined |Six days ago, astronaut Mark Watney became one of the first people to walk on Mars...       |
| format       |string or undefined |411 Pages      |
| publisher       |string or undefined |Broadway Books       |
| relation       |string or undefined |A related resource        |
| publisher       |string or undefined |Broadway Books       |
| rights       |string or undefined |All rights reserved       |
| publisher       |string or undefined |Broadway Books       |
| source       |string or undefined |A related resource from which the described resource is derived.|
| subject       |string or undefined |Adventure stories       |
| type       |string or undefined |Text |
| cover       |base 64 string or undefined |ZXhhbXBsZSBib29rIGNvdmVyIHBob3RvIA== |
| cover_filetype       |base 64 string or undefined |image/jpeg |



