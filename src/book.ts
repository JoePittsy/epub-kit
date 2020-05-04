import StreamZip from "node-stream-zip";
import xmldoc, { XmlDocument, XmlNode, XmlElement } from 'xmldoc';
import pathLib from 'path';
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
type Metadata = { [key: string]: UString; }
type ImageMimetype = "image/jpeg" | "image/gif" | "image/png" | "image/svg+xml" | undefined;
type UString = string|undefined;

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
    private coverMimeype: ImageMimetype;

    private manifest: xmldoc.XmlElement | undefined;
    private metadata: xmldoc.XmlElement | undefined;


    private path: string;

    /** Construct a book object. */
    constructor(path: string) { this.path = path; }


    /**
     * Read the books metadata and returns a metadata object
     * @returns {Promise<Metadata>} Promise object represents the metadata of the book
     */
    async read(filter?: string[]): Promise<Metadata> {

        let getValue = (name: string, data: XmlElement): UString => {
            let object = data.childNamed(name);
            if (object) { return object.val }
            return undefined;
        }

        let getCover = (metadata: xmldoc.XmlElement, manifest: xmldoc.XmlElement, opfObject: any): [UString, ImageMimetype] => {
            let contentOpfLocation = pathLib.dirname(opfObject.name);
            let coverObj = manifest.childWithAttribute("id", "cover-image");
            if (!coverObj) {
                let coverTarget = metadata.childWithAttribute("name", "cover")?.attr.content;
                if (coverTarget) coverObj = manifest.childWithAttribute("id", coverTarget);
            }
            if (coverObj) return [pathLib.join(contentOpfLocation, coverObj.attr.href), coverObj.attr["media-type"] as ImageMimetype];
            return [undefined, undefined];
        }


        let zip: StreamZip;

        var zipPromise = new Promise((resolve, reject) => {
            zip = new StreamZip({
                file: this.path,
                storeEntries: true,
            });
            zip.on("ready", resolve);
            zip.on("error", reject);
        });

        await zipPromise
            .then(() => {
                let opfObject = Object.values(zip.entries()).filter((x: any) => { return pathLib.extname(x.name) === ".opf" })[0];
                let document = new xmldoc.XmlDocument(zip.entryDataSync(opfObject.name).toString("utf-8"));
                this.metadata = document.childNamed("metadata");
                this.manifest = document.childNamed("manifest");

                if (this.metadata) {
                    this.title = String(getValue("dc:title", this.metadata));
                    this.identifier = String(getValue("dc:identifier", this.metadata));
                    this.language = String(getValue("dc:language", this.metadata));
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
                        [coverPath, this.coverMimeype] = getCover(this.metadata, this.manifest, opfObject);
                        if(coverPath){
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
            "title": this.title,
            "identifier": this.identifier,
            "creator": this.creator,
            "language": this.language,
            "contributor": this.contributor,
            "coverage": this.coverage,
            "date": this.date,
            "description": this.description,
            "format": this.format,
            "publisher": this.publisher,
            "relation": this.relation,
            "rights": this.rights,
            "source": this.source,
            "subject": this.subject,
            "type": this.type,
            "cover": this.cover,
            "coverMimetype": this.coverMimeype
        }
        let props = Object.keys(allData);

        if (!filter) {
            return allData;
        } else {
            let removed = props.filter(x => !filter.includes(x));
            removed.forEach(key => delete allData[key]);
            return allData;
        }
    }
}
export = Book;