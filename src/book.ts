import StreamZip from "node-stream-zip";
import xmldoc, { XmlDocument, XmlNode, XmlElement } from 'xmldoc';
import pathLib from 'path';

type Metadata = { [key: string]: string | undefined; }

/** Class representing a book. */
class Book {
    private title: string | undefined;
    private identifier: string | undefined;
    private language: string | undefined;
    private creator: string | undefined;
    private contributor: string | undefined;
    private coverage: string | undefined | undefined;
    private date: string | undefined;
    private description: string | undefined;
    private format: string | undefined;
    private publisher: string | undefined;
    private relation: string | undefined;
    private rights: string | undefined;
    private source: string | undefined;
    private subject: string | undefined;
    private type: string | undefined;

    private manifest: xmldoc.XmlElement | undefined;
    private metadata: xmldoc.XmlElement | undefined;


    private path: string;

    /** Construct a book object. */
    constructor(path: string) { this.path = path; }
    /**
       * A books Metadata
       * @typedef {Object} Metadata
       * @property {string|undefined} [title] - A name given to the resource.
       * @property {string|undefined} [identifier] - An unambiguous reference to the resource within a given context.
       * @property {string|undefined} [creator] - An entity responsible for making contributions to the resource.
       * @property {string|undefined} [language] - A language of the resource.
       * @property {string|undefined} [contributor] - An entity responsible for making contributions to the resource.
       * @property {string|undefined} [coverage] - The spatial or temporal topic of the resource, spatial applicability of the resource, or jurisdiction under which the resource is relevant.
       * @property {string|undefined} [date] - A point or period of time associated with an event in the lifecycle of the resource.
       * @property {string|undefined} [description] - An account of the resource.
       * @property {string|undefined} [format] - The file format, physical medium, or dimensions of the resource.
       * @property {string|undefined} [publisher] - An entity responsible for making the resource available.
       * @property {string|undefined} [relation] - A related resource.
       * @property {string|undefined} [rights] - Information about rights held in and over the resource.
       * @property {string|undefined} [source] - A related resource from which the described resource is derived.
       * @property {string|undefined} [subject] - The topic of the resource.
       * @property {string|undefined} [type] - The nature or genre of the resource.
       */

    /**
     * Read the books metadata and returns a metadata object
     * @returns {Promise<Metadata>} Promise object represents the metadata of the book
     */
    async read(): Promise<Metadata> {
        let getValue = (name: string, data: XmlElement): string | undefined => {
            let object = data.childNamed(name);
            if (object) { return object.val }
            return undefined;
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
                zip.close();
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
                }
            });
        return this.getData();
    }


    /**
     * Get the Dublin Core metadata, if a filter is supplied then the object will be filtered to those keys else all the metadata is returned as an object
     * @param {string[]} filter An array of strings to filter the output to. Valid strings are title, identifier, creator, language, contributor, coverage, date, description, format, publisher, relation, rights, source, subject and type
     * @returns {Metadata} Metadata either filtered or full.
     */
    getData(filter?: String[]): Metadata {
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
            "type": this.type
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