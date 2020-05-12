import StreamZip from "node-stream-zip";
import xmldoc, { XmlElement } from "xmldoc";
import pathLib from "path";
import archiver from "archiver";
import fs from "fs";
// @ts-ignore
import rimraf from "rimraf";
import { resolve } from "dns";

/**
 * A books Metadata
 * @typedef {Object} Metadata
 * @property {UString} [title] - A name given to the resource.
 * @property {UString} [identifier] - An unambiguous reference to the resource within a given context.
 * @property {UString} [creator] - An entity responsible for making contributions to the resource.
 * @property {UString} [language] - A language of the resource.
 * @property {UString} [contributor] - An entity responsible for making contributions to the resource.
 * @property {UString} [coverage] - The spatial or temporal topic of the resource, spatial applicability of the resource, or jurisdiction under which the resource is relevant.
 * @property {UString} [date] - A point or period of time associated with an event in the lifecycle of the resource.
 * @property {UString} [description] - An account of the resource.
 * @property {UString} [format] - The file format, physical medium, or dimensions of the resource.
 * @property {UString} [publisher] - An entity responsible for making the resource available.
 * @property {UString} [relation] - A related resource.
 * @property {UString} [rights] - Information about rights held in and over the resource.
 * @property {UString} [source] - A related resource from which the described resource is derived.
 * @property {UString} [subject] - The topic of the resource.
 * @property {UString} [type] - The nature or genre of the resource.
 * @property {UString} [cover] - Base64 representation of the cover image
 * @property {ImageMimetype} [coverMimeype] - The MIME type of the cover image
 */
type Metadata = { [key: string]: UString };
type ImageMimetype =
  | "image/jpeg"
  | "image/gif"
  | "image/png"
  | "image/svg+xml"
  | undefined;
type UString = string | undefined;

/**
 * Zips a directory
 * Thank you to D.Dimitrioglo for this function.
 * https://stackoverflow.com/questions/15641243/need-to-zip-an-entire-directory-using-node-js
 * @param source The folder to zip
 * @param out The output directory
 */
function zipDirectory(source: string, out: string) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on("error", (err) => reject(err))
      .pipe(stream);

    stream.on("close", () => resolve());
    archive.finalize();
  });
}

/** Class representing a book. */
class Book {
  private title: UString;
  private identifier: UString;
  private language: UString;
  private creator: UString;
  private contributor: UString;
  private coverage: UString;
  private date: UString;
  private description: UString;
  private format: UString;
  private publisher: UString;
  private relation: UString;
  private rights: UString;
  private source: UString;
  private subject: UString;
  private type: UString;
  private cover: UString;
  private coverMimetype: ImageMimetype;

  private manifest: xmldoc.XmlElement | undefined;
  private metadata: xmldoc.XmlElement | undefined;

  private path: string;

  /** Construct a book object. */
  constructor(path: string) {
    this.path = path;
  }

  /**
   * Read the books metadata and returns a metadata object
   * @returns {Promise<Metadata>} Promise object represents the metadata of the book
   */
  async read(filter?: string[]): Promise<Metadata> {
    let getValue = (name: string, data: XmlElement): UString => {
      let object = data.childNamed(name);
      if (object) {
        return object.val;
      }
      return undefined;
    };

    let getCover = (
      metadata: xmldoc.XmlElement,
      manifest: xmldoc.XmlElement,
      opfObject: any
    ): [UString, ImageMimetype] => {
      let contentOpfLocation = pathLib.dirname(opfObject.name);
      let coverObj = manifest.childWithAttribute("id", "cover-image");
      if (!coverObj) {
        let coverTarget = metadata.childWithAttribute("name", "cover")?.attr
          .content;
        if (coverTarget)
          coverObj = manifest.childWithAttribute("id", coverTarget);
      }
      if (coverObj)
        return [
          pathLib.join(contentOpfLocation, coverObj.attr.href),
          coverObj.attr["media-type"] as ImageMimetype,
        ];
      return [undefined, undefined];
    };

    let zip: StreamZip;

    var zipPromise = new Promise((resolve, reject) => {
      zip = new StreamZip({
        file: this.path,
        storeEntries: true,
      });
      zip.on("ready", resolve);
      zip.on("error", reject);
    });

    await zipPromise.then(() => {
      let opfObject = Object.values(zip.entries()).filter((x: any) => {
        return pathLib.extname(x.name) === ".opf";
      })[0];
      let document = new xmldoc.XmlDocument(
        zip.entryDataSync(opfObject.name).toString("utf-8")
      );
      this.metadata = document.childNamed("metadata");
      this.manifest = document.childNamed("manifest");

      if (this.metadata) {
        this.title = getValue("dc:title", this.metadata);
        this.identifier = getValue("dc:identifier", this.metadata);
        this.language = getValue("dc:language", this.metadata);
        this.creator = getValue("dc:creator", this.metadata);
        this.contributor = getValue("dc:contributor", this.metadata);
        this.coverage = getValue("dc:coverage", this.metadata);
        this.date = getValue("dc:date", this.metadata);
        this.description = getValue("dc:description", this.metadata);
        this.format = getValue("dc:format", this.metadata);
        this.publisher = getValue("dc:publisher", this.metadata);
        this.relation = getValue("dc:relation", this.metadata);
        this.rights = getValue("dc:rights", this.metadata);
        this.source = getValue("dc:source", this.metadata);
        this.subject = getValue("dc:subject", this.metadata);
        this.type = getValue("dc:type", this.metadata);

        if (this.manifest) {
          let coverPath;
          [coverPath, this.coverMimetype] = getCover(
            this.metadata,
            this.manifest,
            opfObject
          );
          if (coverPath) {
            let coverData = zip.entryDataSync(coverPath);
            zip.close();
            this.cover = coverData.toString("base64");
          }
        }
      }
    });
    return this.getData(filter);
  }

  /**
   * Get the Dublin Core metadata, if a filter is supplied then the object will be filtered to those keys else all the metadata is returned as an object
   * @param {string[]} filter An array of strings to filter the output to. Valid strings are title, identifier, creator, language, contributor, coverage, date, description, format, publisher, relation, rights, source, subject and type
   * @returns {Metadata} Metadata either filtered or full.
   */
  getData(filter?: string[]): Metadata {
    let allData: Metadata = {
      title: this.title,
      identifier: this.identifier,
      creator: this.creator,
      language: this.language,
      contributor: this.contributor,
      coverage: this.coverage,
      date: this.date,
      description: this.description,
      format: this.format,
      publisher: this.publisher,
      relation: this.relation,
      rights: this.rights,
      source: this.source,
      subject: this.subject,
      type: this.type,
      cover: this.cover,
      coverMimetype: this.coverMimetype,
    };
    let props = Object.keys(allData);

    if (!filter) {
      return allData;
    } else {
      let removed = props.filter((x) => !filter.includes(x));
      removed.forEach((key) => delete allData[key]);
      return allData;
    }
  }

  /**
   * Takes in a new meatdata onject and overwrites the current data.
   * @param newData The new data to overwrite the old data
   */
  setData(newData: Metadata): Metadata {
    this.title = newData.title;
    this.identifier = newData.identifier;
    this.language = newData.language;
    this.creator = newData.creator;
    this.contributor = newData.contributor;
    this.coverage = newData.coverage;
    this.date = newData.date;
    this.description = newData.description;
    this.format = newData.format;
    this.publisher = newData.publisher;
    this.relation = newData.relation;
    this.rights = newData.rights;
    this.source = newData.source;
    this.subject = newData.subject;
    this.type = newData.type;
    this.cover = newData.cover;
    this.coverMimetype = newData.coverMimetype as ImageMimetype;

    return this.getData();
  }

  /**
   * Takes in a object and edits the exisiting data.
   * @param edits The data to change
   */
  editData(edits: Metadata): Metadata {
    this.title = edits.title ? edits.title : this.title;
    this.identifier = edits.identifier ? edits.identifier : this.identifier;
    this.language = edits.language ? edits.language : this.language;
    this.creator = edits.creator ? edits.creator : this.creator;
    this.contributor = edits.contributor ? edits.contributor : this.contributor;
    this.coverage = edits.coverage ? edits.coverage : this.coverage;
    this.date = edits.date ? edits.date : this.date;
    this.description = edits.description ? edits.description : this.description;
    this.format = edits.format ? edits.format : this.format;
    this.publisher = edits.publisher ? edits.publisher : this.publisher;
    this.relation = edits.relation ? edits.relation : this.relation;
    this.rights = edits.rights ? edits.rights : this.rights;
    this.source = edits.source ? edits.source : this.source;
    this.subject = edits.subject ? edits.subject : this.subject;
    this.type = edits.type ? edits.type : this.type;
    this.cover = edits.cover ? edits.cover : this.cover;
    this.coverMimetype = edits.coverMimetype
      ? (edits.coverMimetype as ImageMimetype)
      : this.coverMimetype;

    return this.getData();
  }

  async save(): Promise<boolean>{
    await new Promise((resolve) => {
      rimraf("extracted", resolve);
    });

    let zip: StreamZip;

    let zipPromise = new Promise((resolve, reject) => {
      zip = new StreamZip({
        file: this.path,
        storeEntries: true,
      });
      zip.on("ready", resolve);
      zip.on("error", reject);
    });

    await zipPromise.then(() => {
      let opfObject = Object.values(zip.entries()).filter((x: any) => {
        return pathLib.extname(x.name) === ".opf";
      })[0];
      let document = new xmldoc.XmlDocument(
        zip.entryDataSync(opfObject.name).toString("utf-8")
      );
      let t = document.childNamed("dc:title");
      if (t) {
        t.val = "Test";
        console.log(t);
      }
    });
    let extractPromise = new Promise((resolve, reject) => {
      fs.mkdirSync("extracted");
      // @ts-ignore
      zip.extract(null, "./extracted", (err, count) => {
        console.log(err ? "Extract error" : `Extracted ${count} entries`);
        zip.close();
        if(err) {reject()}
        else{resolve();}
      });
    });
    await extractPromise;
    return true; 
  }
}

async function main() {
  let book = new Book(
    "/home/joe/Downloads/Issac Asimov Foundation Series Complete [EDGE]/Gregory Benford - Foundation's Fear.epub"
  );
  await book.read();
  await book.save();
  console.log("Saved!");
}

main();
// export = Book;
