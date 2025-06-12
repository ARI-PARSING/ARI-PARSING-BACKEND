import { fileExists, readFileJson, readFileTxt, readFileXml, removeFile, } from '../utils/fileHandler.util.js';
import { convertCsvToListMap, convertJsonToListMap, convertXmlToListMap, } from '../utils/mappingData.util.js';
import { unflattenObject } from '../utils/objectFlatter.util.js';
import { convertDataToCvs, convertDataToJson, convertDataToTXT, convertDataToXML, } from '../utils/dataParser.util.js';
import FILE_TYPES from '../utils/constants/fileTypes.constant.js';
import ServiceError from '../utils/errors/service.error.util.js';
import Upload from '../utils/errors/codes/upload.codes.js';
import { fileParserService } from './convertFile.service.js';

// Mock all imported utility functions
jest.mock('../utils/fileHandler.util.js');
jest.mock('../utils/mappingData.util.js');
jest.mock('../utils/objectFlatter.util.js');
jest.mock('../utils/dataParser.util.js');

describe('convertFile.service.js', () => {
    const mockFilePath = 'test.txt';
    const mockSecretKey = 'secret';
    const mockDelimiter = ',';

    beforeEach(() => {
        // Reset all mocks
        fileExists.mockReset();
        readFileJson.mockReset();
        readFileTxt.mockReset();
        readFileXml.mockReset();
        removeFile.mockReset();
        convertCsvToListMap.mockReset();
        convertJsonToListMap.mockReset();
        convertXmlToListMap.mockReset();
        unflattenObject.mockReset();
        convertDataToCvs.mockReset();
        convertDataToJson.mockReset();
        convertDataToTXT.mockReset();
        convertDataToXML.mockReset();

        // Default mock implementations
        fileExists.mockReturnValue(true);
        removeFile.mockReturnValue(true); // To avoid issues in finally block
        readFileTxt.mockReturnValue('file content'); // For no conversion path
    });

    describe('fileParserService', () => {
        it('should throw FILE_NOT_FOUND if file does not exist', async () => {
            fileExists.mockReturnValue(false);
            await expect(
                fileParserService(mockFilePath, mockSecretKey, FILE_TYPES.JSON, mockDelimiter)
            ).rejects.toThrow(new ServiceError('File not found please check path coma mieda', Upload.FILE_NOT_FOUND));
            expect(removeFile).toHaveBeenCalledWith(mockFilePath); // finally block
        });

        it('should return base64 of raw content if conversion is not needed (e.g. TXT to CSV)', async () => {
            const filePath = 'test.txt';
            readFileTxt.mockReturnValue('raw txt content');
            // isConvertionNeeded('txt', 'csv') is false
            const result = await fileParserService(filePath, mockSecretKey, FILE_TYPES.CSV, mockDelimiter);
            expect(result).toBe(Buffer.from('raw txt content').toString('base64'));
            expect(readFileTxt).toHaveBeenCalledWith(filePath);
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should return base64 of raw content if file extension is same as target type', async () => {
            const filePath = 'test.json';
            readFileTxt.mockReturnValue('{"key":"value"}'); // readFileTxt is called by no-conversion path
            // isConvertionNeeded('json', 'json') is false
            const result = await fileParserService(filePath, mockSecretKey, FILE_TYPES.JSON, mockDelimiter);
            expect(result).toBe(Buffer.from('{"key":"value"}').toString('base64'));
            expect(readFileTxt).toHaveBeenCalledWith(filePath);
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should process a JSON file to XML correctly', async () => {
            const filePath = 'test.json';
            const jsonData = { data: 'json_data' };
            const mappedData = [{ key: 'data', value: 'json_data' }];
            const unflattenedData = { data: 'json_data' }; // Assuming unflatten is inverse of flatten
            const finalXmlData = '<xml>json_data</xml>';

            readFileJson.mockResolvedValue(jsonData);
            convertJsonToListMap.mockReturnValue(mappedData);
            unflattenObject.mockReturnValue(unflattenedData);
            convertDataToXML.mockReturnValue(finalXmlData);

            const result = await fileParserService(filePath, mockSecretKey, FILE_TYPES.XML, mockDelimiter);

            expect(readFileJson).toHaveBeenCalledWith(filePath);
            expect(convertJsonToListMap).toHaveBeenCalledWith(jsonData, mockSecretKey);
            expect(unflattenObject).toHaveBeenCalledWith(mappedData);
            expect(convertDataToXML).toHaveBeenCalledWith(unflattenedData, 'json', mockDelimiter); // currentFileExtension is 'json'
            expect(result).toBe(Buffer.from(finalXmlData).toString('base64'));
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should process a CSV file to JSON correctly', async () => {
            const filePath = 'test.csv';
            const csvContent = 'h1,h2\nv1,v2';
            const mappedData = [{ key: 'h1', value: 'v1' }, { key: 'h2', value: 'v2' }];
            const unflattenedData = { h1: 'v1', h2: 'v2' };
            const finalJsonData = '{"h1":"v1","h2":"v2"}';

            readFileTxt.mockReturnValue(csvContent); // For extractDataFromFiles -> CSV
            convertCsvToListMap.mockReturnValue(mappedData);
            unflattenObject.mockReturnValue(unflattenedData);
            convertDataToJson.mockReturnValue(finalJsonData);

            const result = await fileParserService(filePath, mockSecretKey, FILE_TYPES.JSON, mockDelimiter);

            expect(readFileTxt).toHaveBeenCalledWith(filePath);
            expect(convertCsvToListMap).toHaveBeenCalledWith(csvContent, mockDelimiter, mockSecretKey);
            expect(unflattenObject).toHaveBeenCalledWith(mappedData);
            expect(convertDataToJson).toHaveBeenCalledWith(unflattenedData, 'csv', mockDelimiter);
            expect(result).toBe(Buffer.from(finalJsonData).toString('base64'));
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should handle TXT to XML conversion', async () => {
            const filePath = 'test.txt';
            const txtContent = 'col1;col2\ndata1;data2'; // Assuming ; is the delimiter
            const mappedData = [{ key: 'col1', value: 'data1' }]; // Simplified
            const unflattenedData = { col1: 'data1' }; // Simplified
            const finalXmlData = '<xml>data1</xml>';

            readFileTxt.mockReturnValue(txtContent);
            convertCsvToListMap.mockReturnValue(mappedData); // TXT uses CSV mapping
            unflattenObject.mockReturnValue(unflattenedData);
            convertDataToXML.mockReturnValue(finalXmlData);

            const result = await fileParserService(filePath, mockSecretKey, FILE_TYPES.XML, mockDelimiter);

            expect(readFileTxt).toHaveBeenCalledWith(filePath);
            expect(convertCsvToListMap).toHaveBeenCalledWith(txtContent, mockDelimiter, mockSecretKey);
            expect(unflattenObject).toHaveBeenCalledWith(mappedData);
            expect(convertDataToXML).toHaveBeenCalledWith(unflattenedData, 'txt', mockDelimiter);
            expect(result).toBe(Buffer.from(finalXmlData).toString('base64'));
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should throw UPLOAD_FILE_TYPE_NOT_SUPPORTED for unknown source extension in extractDataFromFiles', async () => {
            const filePath = 'test.unknown';
            // extractDataFromFiles is called internally. We test its behavior through fileParserService.
            await expect(
                fileParserService(filePath, mockSecretKey, FILE_TYPES.JSON, mockDelimiter)
            ).rejects.toThrow(new ServiceError(`Unsupported file type: unknown`, Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED));
            expect(removeFile).toHaveBeenCalledWith(filePath); // removeFile is called in extractDataFromFiles' default case
        });

        it('should throw UPLOAD_FILE_TYPE_NOT_SUPPORTED for unknown target extension in dataConverterToFile', async () => {
            const filePath = 'test.json'; // Valid source
            const jsonData = { data: 'json_data' };
            const mappedData = [{ key: 'data', value: 'json_data' }];

            readFileJson.mockResolvedValue(jsonData);
            convertJsonToListMap.mockReturnValue(mappedData);
            // dataConverterToFile is called internally.
            await expect(
                fileParserService(filePath, mockSecretKey, 'unknownType', mockDelimiter)
            ).rejects.toThrow(new ServiceError(`Unsupported file type: unknownType`, Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED));
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should call removeFile even if processing fails mid-way', async () => {
            const filePath = 'test.json';
            readFileJson.mockRejectedValue(new Error('Read error'));

            await expect(
                fileParserService(filePath, mockSecretKey, FILE_TYPES.XML, mockDelimiter)
            ).rejects.toThrow(new ServiceError('Read error', Upload.PROCESSINGFILE_ERROR));

            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        // Test for the specific error message from the catch block in fileParserService
        it('should re-throw ServiceError with default code if error is not ServiceError instance', async () => {
            const filePath = 'test.json';
            readFileJson.mockRejectedValue(new Error('Some generic error')); // Not a ServiceError

            await expect(
                fileParserService(filePath, mockSecretKey, FILE_TYPES.XML, mockDelimiter)
            ).rejects.toEqual(expect.objectContaining({
                message: 'Some generic error',
                code: Upload.PROCESSINGFILE_ERROR,
                status: 500 // Default status for ServiceError without specific one
            }));
            expect(removeFile).toHaveBeenCalledWith(filePath);
        });

        it('should correctly pass delimiter to convertCsvToListMap for TXT files', async () => {
            const filePath = 'test.txt';
            const customDelimiter = '|';
            readFileTxt.mockReturnValue('h1|h2\nv1|v2');
            convertCsvToListMap.mockReturnValue([]); // Actual data doesn't matter for this check
            unflattenObject.mockReturnValue({});
            convertDataToJson.mockReturnValue('{}');

            await fileParserService(filePath, mockSecretKey, FILE_TYPES.JSON, customDelimiter);
            expect(convertCsvToListMap).toHaveBeenCalledWith('h1|h2\nv1|v2', customDelimiter, mockSecretKey);
        });

        it('should correctly pass delimiter to dataConverterToFile for CSV output', async () => {
            const filePath = 'test.json';
            const customDelimiter = '|';
            readFileJson.mockResolvedValue({});
            convertJsonToListMap.mockReturnValue([]);
            unflattenObject.mockReturnValue({});
            convertDataToCvs.mockReturnValue(''); // Actual data doesn't matter

            await fileParserService(filePath, mockSecretKey, FILE_TYPES.CSV, customDelimiter);
            // The last argument to convertDataToCvs is the delimiter
            expect(convertDataToCvs).toHaveBeenCalledWith([], 'json', customDelimiter);
        });
    });
});