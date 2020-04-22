let parser = require("xml2json");
let fs = require("fs");
let StreamZip = require("node-stream-zip");

function parseEpub(path, callback) {
  let zip = new StreamZip({
    file: path,
    storeEntries: true,
  }).on("ready", () => {
    let target = "";
    for (const entry of Object.values(zip.entries())) {
      if (entry.name.substring(entry.name.length - 3) === "opf") {
        target = entry.name;
        break;
      }
    }
    let xml = zip.entryDataSync(target).toString("utf8");
    let json = JSON.parse(parser.toJson(xml));
    let meta = json.package.metadata;
    let manifest = json.package.manifest;
    let cover = null;
    // Reverse for as the cover is usualy at the bottom
    for (let index = manifest.item.length-1; index > 0; index--) {
      const element = manifest.item[index];
      // console.log(element.id);
      if (element.id === "cover-image") {
        cover = element.href;
        break;
      }
    }
    let cover_target = "";
    if(cover === null){//using old spec
      for (let index = 0; index < meta.meta.length; index++) {
        const element = meta.meta[index];
        if(element.name==="cover"){
          cover_target = element.content;
          break;
        }
      }
      for (let index = manifest.item.length-1; index > 0; index--) {
        const element = manifest.item[index];
        // console.log(element.id);
        if (element.id === cover_target) {
          cover = element.href;
          break;
        }
      }
    } 
    zip.close();

    let data = {
      title: meta["dc:title"],
      creator: meta["dc:creator"]["$t"],
      publisher: meta["dc:publisher"],
      date: meta["dc:date"]["$t"],
      ID: meta["dc:identifier"]["$t"],
      language: meta["dc:language"],
      copyright: meta["dc:rights"],
      coverPath: cover
    };
    callback(data);
  });
}

module.exports = {parseEpub};