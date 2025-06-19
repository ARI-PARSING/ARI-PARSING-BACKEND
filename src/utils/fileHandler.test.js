import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { fileExists, readFileTxt, readFileJson, readFileXml, removeFile, } from './fileHandler.util.js';

// Mock the 'fs' module
jest.mock('fs');

// Mock fast-xml-parser
const mockActualParse = jest.fn();
jest.mock('fast-xml-parser', () => {
    return {
        XMLParser: jest.fn().mockImplementation(() => {
            return { parse: mockActualParse };
        }),
    };
});

describe('fileHandler.util.js', () => {
    const mockFilePath = '/mock/path/to/file.txt';
    const mockXmlFilePath = '/mock/path/to/file.xml';
    const mockJsonFilePath = '/mock/path/to/file.json';

    beforeEach(() => {
        // Reset all fs mocks before each test
        fs.existsSync.mockReset();
        fs.readFileSync.mockReset();
        fs.unlinkSync.mockReset();

        // Reset XMLParser mocks
        XMLParser.mockClear(); // Clear the constructor mock
        mockActualParse.mockReset(); // Reset the shared parse mock
    });

    // --- fileExists ---
    describe('fileExists', () => {
        it('should return true if fs.existsSync returns true', () => {
            fs.existsSync.mockReturnValue(true);
            expect(fileExists(mockFilePath)).toBe(true);
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);
        });

        it('should return false if fs.existsSync returns false', () => {
            fs.existsSync.mockReturnValue(false);
            expect(fileExists(mockFilePath)).toBe(false);
            expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);
        });
    });

    // --- readFileTxt ---
    describe('readFileTxt', () => {
        it('should read and return file content if file exists', () => {
            const mockContent = 'Hello, world!';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(mockContent);

            expect(readFileTxt(mockFilePath)).toBe(mockContent);
            expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf8');
        });

        it('should return null if file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            expect(readFileTxt(mockFilePath)).toBeNull();
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });
    });

    // --- readFileJson ---
    describe('readFileJson', () => {
        it('should read and parse JSON file if file exists', () => {
            const mockJsonContent = { key: 'value' };
            const mockFileContentString = JSON.stringify(mockJsonContent);
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(mockFileContentString);

            expect(readFileJson(mockJsonFilePath)).toEqual(mockJsonContent);
            expect(fs.readFileSync).toHaveBeenCalledWith(mockJsonFilePath, 'utf8');
        });

        it('should return null if file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            expect(readFileJson(mockJsonFilePath)).toBeNull();
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        it('should throw an error for invalid JSON content', () => {
            const invalidJsonString = 'not a json';
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(invalidJsonString);
            expect(() => readFileJson(mockJsonFilePath)).toThrow(SyntaxError);
        });
    });

    // --- readFileXml ---
    describe('readFileXml', () => {
        it('should read and parse XML file if file exists', () => {
            const mockXmlContentString = '<root><item>Test</item></root>';
            const mockParsedXml = { root: { item: 'Test' } };
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(mockXmlContentString);

            mockActualParse.mockReturnValue(mockParsedXml); // Configure the shared mock

            expect(readFileXml(mockXmlFilePath)).toEqual(mockParsedXml);
            expect(fs.readFileSync).toHaveBeenCalledWith(mockXmlFilePath, 'utf8');
            expect(XMLParser).toHaveBeenCalledWith({ // Check constructor arguments
                ignoreAttributes: false,
                attributeNamePrefix: '',
            });
            expect(mockActualParse).toHaveBeenCalledWith(mockXmlContentString); // Check parse arguments
        });

        it('should return null if file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            expect(readFileXml(mockXmlFilePath)).toBeNull();
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        it('should correctly pass options to XMLParser', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('<root></root>');
            mockActualParse.mockReturnValue({}); // ensure parse is callable and returns something

            readFileXml(mockXmlFilePath);
            expect(XMLParser).toHaveBeenCalledWith({ // This check remains valid
                ignoreAttributes: false,
                attributeNamePrefix: '',
            });
        });
    });

    // --- removeFile ---
    describe('removeFile', () => {
        it('should call fs.unlinkSync if file exists', () => {
            fs.existsSync.mockReturnValue(true);
            expect(removeFile(mockFilePath)).toBe(true);
            expect(fs.unlinkSync).toHaveBeenCalledWith(mockFilePath);
        });

        it('should not call fs.unlinkSync if file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            expect(removeFile(mockFilePath)).toBe(true); // Function returns true even if file doesn't exist
            expect(fs.unlinkSync).not.toHaveBeenCalled();
        });
    });
});
