import {
    fileExists,
    readFileJson,
    readFileTxt,
    readFileXml,
    removeFile
} from '../utils/fileHandler.util.js';
import {
    convertCsvToListMap,
    convertJsonToListMap,
    convertXmlToListMap
} from '../utils/mappingData.util.js';
import { unflattenObject } from '../utils/objectFlatter.util.js';
import {
    convertDataToCvs,
    convertDataToJson,
    convertDataToTXT,
    convertDataToXML
} from '../utils/dataParser.util.js';
import FILE_TYPES from '../utils/constants/fileTypes.constant.js';
import ServiceError from '../utils/errors/service.error.util.js';
import Upload from '../utils/errors/codes/upload.codes.js';
import { fileParserService } from './convertFile.service.js';

// Mocks
jest.mock('../utils/fileHandler.util.js');
jest.mock('../utils/mappingData.util.js');
jest.mock('../utils/objectFlatter.util.js');
jest.mock('../utils/dataParser.util.js');

describe('convertFile.service.js', () => {
    const mockFilePath = 'test.txt';
    const mockSecretKey = 'secret';
    const mockDelimiter = ',';

    beforeEach(() => {
        jest.clearAllMocks();

        // Mocks básicos
        fileExists.mockImplementation(async (path) => path !== 'missing.txt');
        removeFile.mockResolvedValue(true);

        // Mocks de lectura
        readFileTxt.mockImplementation(async (path) => {
            if (path.endsWith('.txt')) return 'raw txt content';
            if (path.endsWith('.csv')) return 'header1,header2\nvalue1,value2';
            return '';
        });

        readFileJson.mockResolvedValue({ key: 'value' });
        readFileXml.mockResolvedValue('<root><item>data</item></root>');

        // Mocks de conversión
        convertJsonToListMap.mockResolvedValue([[{ key: 'key', value: 'value' }]]);
        convertCsvToListMap.mockResolvedValue([
            [
                { key: 'header1', value: 'value1' },
                { key: 'header2', value: 'value2' }
            ]
        ]);
        convertXmlToListMap.mockResolvedValue([[{ key: 'item', value: 'data' }]]);

        unflattenObject.mockImplementation((data) => {
            const result = {};
            data.forEach((item) => {
                item.forEach(({ key, value }) => {
                    result[key] = value;
                });
            });
            return result;
        });

        convertDataToXML.mockResolvedValue('<xml>converted</xml>');
        convertDataToJson.mockResolvedValue('{"converted":true}');
        convertDataToCvs.mockResolvedValue('converted,csv');
        convertDataToTXT.mockResolvedValue('converted txt');
    });

    describe('fileParserService', () => {
        it('should throw FILE_NOT_FOUND if file does not exist', async () => {
            await expect(
                fileParserService('missing.txt', mockSecretKey, FILE_TYPES.JSON, mockDelimiter)
            ).rejects.toThrow(
                new ServiceError(
                    'File not found please check path coma mieda',
                    Upload.FILE_NOT_FOUND
                )
            );

            expect(removeFile).toHaveBeenCalledWith('missing.txt');
        });

        it('should return base64 of raw content if conversion is not needed (TXT to CSV)', async () => {
            const result = await fileParserService('test.txt', mockSecretKey, FILE_TYPES.CSV, mockDelimiter);

            expect(result).toBe(Buffer.from('raw txt content').toString('base64'));
            expect(readFileTxt).toHaveBeenCalledWith('test.txt');
            expect(removeFile).toHaveBeenCalledWith('test.txt');
        });

        it('should return base64 of raw content if file extension matches target type', async () => {
            const result = await fileParserService('test.json', mockSecretKey, FILE_TYPES.JSON, mockDelimiter);

            expect(result).toBe(Buffer.from('{"key":"value"}').toString('base64'));
            expect(readFileJson).toHaveBeenCalledWith('test.json');
        });

        it('should process JSON to XML conversion correctly', async () => {
            const result = await fileParserService('test.json', mockSecretKey, FILE_TYPES.XML, mockDelimiter);

            expect(readFileJson).toHaveBeenCalledWith('test.json');
            expect(convertJsonToListMap).toHaveBeenCalledWith({ key: 'value' }, mockSecretKey);
            expect(unflattenObject).toHaveBeenCalled();
            expect(convertDataToXML).toHaveBeenCalledWith(expect.any(Object), 'json', mockDelimiter);
            expect(result).toBe(Buffer.from('<xml>converted</xml>').toString('base64'));
        });

        it('should process CSV to JSON conversion correctly', async () => {
            const result = await fileParserService('test.csv', mockSecretKey, FILE_TYPES.JSON, mockDelimiter);

            expect(readFileTxt).toHaveBeenCalledWith('test.csv');
            expect(convertCsvToListMap).toHaveBeenCalledWith(
                'header1,header2\nvalue1,value2',
                mockDelimiter,
                mockSecretKey
            );
            expect(convertDataToJson).toHaveBeenCalledWith(expect.any(Object), 'csv', mockDelimiter);
            expect(result).toBe(Buffer.from('{"converted":true}').toString('base64'));
        });

        it('should handle TXT to XML conversion with custom delimiter', async () => {
            const customDelimiter = '|';
            const result = await fileParserService('test.txt', mockSecretKey, FILE_TYPES.XML, customDelimiter);

            expect(convertCsvToListMap).toHaveBeenCalledWith('raw txt content', customDelimiter, mockSecretKey);
            expect(result).toBe(Buffer.from('<xml>converted</xml>').toString('base64'));
        });

        it('should throw for unsupported source file type', async () => {
            await expect(
                fileParserService('test.unknown', mockSecretKey, FILE_TYPES.JSON, mockDelimiter)
            ).rejects.toThrow(
                new ServiceError('Unsupported file type: unknown', Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED)
            );
        });

        it('should throw for unsupported target file type', async () => {
            await expect(
                fileParserService('test.json', mockSecretKey, 'unknownType', mockDelimiter)
            ).rejects.toThrow(
                new ServiceError('Unsupported file type: unknownType', Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED)
            );
        });

        it('should clean up files when processing fails', async () => {
            readFileJson.mockRejectedValueOnce(new Error('Read error'));

            await expect(
                fileParserService('test.json', mockSecretKey, FILE_TYPES.XML, mockDelimiter)
            ).rejects.toThrow(
                new ServiceError('Read error', Upload.PROCESSINGFILE_ERROR)
            );

            expect(removeFile).toHaveBeenCalledWith('test.json');
        });

        it('should wrap generic errors in ServiceError', async () => {
            const genericError = new Error('Some generic error');
            readFileJson.mockRejectedValueOnce(genericError);

            await expect(
                fileParserService('test.json', mockSecretKey, FILE_TYPES.XML, mockDelimiter)
            ).rejects.toEqual(
                expect.objectContaining({
                    message: 'Some generic error',
                    code: Upload.PROCESSINGFILE_ERROR,
                    status: 500
                })
            );
        });

        it('should handle empty files gracefully', async () => {
            readFileTxt.mockResolvedValueOnce('');

            const result = await fileParserService('empty.txt', mockSecretKey, FILE_TYPES.JSON, mockDelimiter);

            expect(result).toBe(Buffer.from('').toString('base64'));
        });
    });
});
