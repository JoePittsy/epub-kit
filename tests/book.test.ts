import Book from "../src/book";
import { expect } from 'chai';
import { equal } from "assert";


describe('Read Function',  function() {
  it('Should return a promise', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data).to.exist;
  });

  it('Should get the title', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.title).to.equal("The title");
  });

  it('Should get the identifier', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.identifier).to.equal("0-4813-7307-1");
  });

  it('Should get the language', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.language).to.equal("en");
  });

  it('Should get the creator', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.creator).to.equal("The author");
  });
  
  it('Should get the contributor', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.contributor).to.equal("A contributor");
  });

  it('Should get the coverage', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.coverage).to.equal("England");
  });

  it('Should get the date', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.date).to.equal("2020-01-01T01:01:01Z");
  });

  it('Should get the description', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.description).to.equal("A description");
  });

  it('Should get the format', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.format).to.equal("200 Pages");
  });

  it('Should get the publisher', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.publisher).to.equal("The publisher");
  });

  it('Should get the relation', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.relation).to.equal("A related resource");
  });

  it('Should get the rights', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.rights).to.equal("© copyright notice");
  });

  it('Should get the source', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.source).to.equal("Source");
  });

  it('Should get the subject', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.subject).to.equal("A subject of the publication");
  });
  
  it('Should get the type', async function() {
    const testBook = new Book("tests/test.epub");
    const data = await testBook.read();
    expect(data.type).to.equal("Fiction");
  });
});

describe('getData Function',  function() {
  const expected = {
    title: 'The title',
    identifier: '0-4813-7307-1',
    creator: 'The author',
    language: 'en',
    contributor: 'A contributor',
    coverage: 'England',
    date: '2020-01-01T01:01:01Z',
    description: 'A description',
    format: '200 Pages',
    publisher: 'The publisher',
    relation: 'A related resource',
    rights: '© copyright notice',
    source: 'Source',
    subject: 'A subject of the publication',
    type: 'Fiction'
  };
  it("Should return all the data", async function() {    
    const testBook = new Book("tests/test.epub");
    await testBook.read()
    const testData = testBook.getData();
    expect(testData).to.eql(expected);    
  });

  it("Should return filtered data", async function() {    
    const testBook = new Book("tests/test.epub");
    await testBook.read();
    const testData = testBook.getData(["type", "date"]);
    expect(testData.type).to.equal(expected.type);    
    expect(testData.date).to.equal(expected.date);    
  });

  it("Should return nothing", async function() {    
    const testBook = new Book("tests/test.epub");
    await testBook.read();
    const testData = testBook.getData([]);
    expect(testData).to.eql({});
  });
});