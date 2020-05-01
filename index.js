const StreamZip = require("node-stream-zip");
const xmldoc = require('xmldoc');
const pathLib = require('path');

function getValue(name, data) {
  try {
    return data.childNamed(name).val;
  } catch (e) {
    return undefined;
  }
}


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
async function parseEpub(path, callback) {
  let zip = new StreamZip({
    file: path,
    storeEntries: true,
  });

  zip.on("error", (err) => {
    if (callback) {
      callback(err);
      return;
    }
  });

  zip.on("ready", () => {
    let target;

    for (const entry of Object.values(zip.entries())) {
      if (entry.name.substring(entry.name.length - 3) === "opf") {
        target = entry.name;
        break;
      }
    }

    let xml = zip.entryDataSync(target).toString("utf8");
    let document = new xmldoc.XmlDocument(xml);


    let metadata = document.childNamed("metadata");

    let book = {
      title: getValue("dc:title", metadata),
      identifier: getValue("dc:identifier", metadata),
      creator: getValue("dc:creator", metadata),
      language: getValue("dc:language", metadata),
      contributor: getValue("dc:contributor", metadata),
      coverage: getValue("dc:coverage", metadata),
      date: getValue("dc:date", metadata),
      description: getValue("dc:description", metadata),
      format: getValue("dc:format", metadata),
      publisher: getValue("dc:publisher", metadata),
      relation: getValue("dc:relation", metadata),
      rights: getValue("dc:rights", metadata),
      source: getValue("dc:source", metadata),
      subject: getValue("dc:subject", metadata),
      type: getValue("dc:type", metadata),
      cover: undefined,
      cover_filetype: undefined
    }

    let cover_path;

    try {
      cover_path = pathLib.join(pathLib.dirname(target), document.childNamed("manifest").childWithAttribute("id", "cover-image").attr.href);
      book.cover_filetype = document.childNamed("manifest").childWithAttribute("id", "cover-image").attr["media-type"];
    } catch (e) {
      try {
        let cover_target = metadata.childWithAttribute("name", "cover").attr.content;
        cover_path = pathLib.join(pathLib.dirname(target), document.childNamed("manifest").childWithAttribute("id", cover_target).attr.href);
        book.cover_filetype = document.childNamed("manifest").childWithAttribute("id", cover_target).attr["media-type"];
      } catch (e) {
        if (callback) { callback(e); return; }
      }
    }
    if (cover_path) {
      let data = zip.entryDataSync(cover_path);
      zip.close();
      book.cover = data.toString("base64");
    } else {
      zip.close();
    }

    callback(null, book);

  });
}

module.exports = { parseEpub };
