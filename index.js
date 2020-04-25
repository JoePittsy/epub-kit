let parser = require('fast-xml-parser');
let StreamZip = require("node-stream-zip");

/**
 * Callback for parseEpubs.
 *
 * @callback parseEpubCallback
 * @param {Object} err - The error if the code fails
 * @param {Object} data - The book object
 */

/**
 * Returns the ePubs meta data as an object
 * @param {string} path - Path to the epub 
 * @param {parseEpubCallback} callback - Callback with (err, data)
 */
async function parseEpub(path, callback){
  let zip = new StreamZip({
    file: path,
    storeEntries: true,
  });
  zip.on("error", err => {callback(err); return;} );
  zip.on("ready", () => {
    let target;

    for (const entry of Object.values(zip.entries())) {
      if (entry.name.substring(entry.name.length - 3) === "opf") {
        target = entry.name;
        break;
      }
    }
    let xml = zip.entryDataSync(target).toString("utf8");
    let json = parser.parse(xml);
    let meta = json.package.metadata;
    let manifest = json.package.manifest;
    let cover = null;
    // Reverse for as the cover is usualy at the bottom
    for (let index = manifest.item.length - 1; index > 0; index--) {
      const element = manifest.item[index];
      // console.log(element.id);
      if (element.id === "cover-image") {
        cover = element.href;
        break;
      }
    }
    let cover_target = "";
    if (cover === null) {
      //using old spec
      for (let index = 0; index < meta.meta.length; index++) {
        const element = meta.meta[index];
        if (element.name === "cover") {
          cover_target = element.content;
          break;
        }
      }
      for (let index = manifest.item.length - 1; index > 0; index--) {
        const element = manifest.item[index];
        // console.log(element.id);
        if (element.id === cover_target) {
          cover = element.href;
          break;
        }
      }
    }
    zip.close();
    let data = new Object();
    try {
      data.title = meta["dc:title"];
    } catch (e) {
      data.title = null;
    }
    try {
      data.creator = meta["dc:creator"];
    } catch (e) {
      data.creator = null;
    }
    try {
      data.publisher = meta["dc:publisher"];
    } catch (e) {
      data.publisher = null;
    }
    try {
      data.date = meta["dc:date"];
    } catch (e) {
      data.date = null;
    }
    try {
      data.ID = meta["dc:identifier"];
    } catch (e) {
      data.ID = null;
    }
    try {
      data.language = meta["dc:language"];
    } catch (e) {
      data.language = null;
    }
    try {
      data.copyright = meta["dc:rights"];
    } catch (e) {
      data.copyright = null;
    }
    try {
      let opf_loc = target.substring(0, target.lastIndexOf("/"));
      if(cover != null){
        if(opf_loc != ""){
          data.coverPath = `${target.substring(0, target.lastIndexOf("/"))}/${cover}`;
        }
        else{
          data.coverPath = cover;
        }
      }
      else{
        data.coverPath = null;
      }
      
    } catch (e) {
      data.coverPath = null;
      console.log(e)
    }

    callback(null, data);
  });
}

/**
 * Callback for getCover.
 *
 * @callback getCoverCallback
 * @param {Object} err - The error if the code fails
 * @param {Object[string, base64]} data - The file type of the image and the image as a base64 string
 */

/**
 * Returns the cover in base64 and its filetype
 * @param {string} path 
 * @param {getCoverCallback} callback 
 */
function getCover(path, callback){
  parseEpub(path, (err, book) => {
    if (err) { callback(err); return; }
    if (book.coverPath == null){callback("No cover image"); return;}

    let zip = new StreamZip({
      file: path,
      storeEntries: true,
    });

    zip.on("error", err => {callback(err); return;} );

    zip.on("ready", () => { 
      let data = zip.entryDataSync(book.coverPath);
      zip.close();
      let dataType = book.coverPath.substring(book.coverPath.lastIndexOf(".")+1);
      let base = data.toString('base64')
      callback(null, [dataType, base]);
      return;
    });

  })
}
module.exports = { parseEpub, getCover };
