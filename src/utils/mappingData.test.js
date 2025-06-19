import { convertJsonToListMap, convertXmlToListMap, convertCsvToListMap, convertTXTToListMap } from './mappingData.util.js';
import { flattenObject } from './objectFlatter.util.js';
import tokenStrategies from './security/jwt.security.util.js';

// Mock dependencies
jest.mock('./objectFlatter.util.js', () => ({
    flattenObject: jest.fn(),
}));

jest.mock('./security/jwt.security.util.js', () => ({
    JWT_TARGET_CODE: {
        generateToken: jest.fn().mockImplementation((value) => ({ token: `tokenized_${value}` })),
    },
}));

describe('mappingData.util.js', () => {
    const mockSecretKey = 'test-secret';
    const mockXmlData = { root: { item: { name: 'Test', value: '123' } } };
    const mockCsvData = "name,value\nTest,123";
    const mockTxtData = "name;value\nTest;123";

    beforeEach(() => {
        jest.clearAllMocks();
        flattenObject.mockImplementation(obj => {
            const result = {};
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    Object.assign(result, flattenObject(obj[key]));
                } else {
                    result[key] = obj[key];
                }
            }
            return result;
        });
    });

    describe('convertJsonToListMap', () => {
        it('should convert simple JSON object to list map', () => {
            const jsonData = { name: 'John', age: 30 };
            const result = convertJsonToListMap(jsonData, mockSecretKey);

            expect(flattenObject).toHaveBeenCalledWith(jsonData);
            expect(result).toEqual([
                [
                    { key: 'name', value: 'John' },
                    { key: 'age', value: 30 },
                ],
            ]);
        });

        it('should handle array of JSON objects', () => {
            const jsonArray = [{ id: 1 }, { id: 2 }];
            const result = convertJsonToListMap(jsonArray, mockSecretKey);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual([{ key: 'id', value: 1 }]);
            expect(result[1]).toEqual([{ key: 'id', value: 2 }]);
        });

        it('should tokenize sensitive fields', () => {
            const jsonData = { name: 'User', tarjeta: '4111111111111111' };
            const result = convertJsonToListMap(jsonData, mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken)
                .toHaveBeenCalledWith('4111111111111111', mockSecretKey);
            expect(result[0]).toContainEqual({
                key: 'tarjeta',
                value: 'tokenized_4111111111111111'
            });
        });

        it('should handle empty object', () => {
            const result = convertJsonToListMap({}, mockSecretKey);
            expect(result).toEqual([[]]);
        });
    });

    describe('convertXmlToListMap', () => {
        it('should convert valid XML data to list map', () => {
            const result = convertXmlToListMap(mockXmlData, mockSecretKey);

            expect(flattenObject).toHaveBeenCalled();
            expect(result).toEqual([
                [
                    { key: 'name', value: 'Test' },
                    { key: 'value', value: '123' },
                ],
            ]);
        });

        it('should handle array of items in XML', () => {
            const xmlData = { root: { item: [{ name: 'A' }, { name: 'B' }] } };
            const result = convertXmlToListMap(xmlData, mockSecretKey);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual([{ key: 'name', value: 'A' }]);
            expect(result[1]).toEqual([{ key: 'name', value: 'B' }]);
        });

        it('should tokenize sensitive fields in XML', () => {
            const xmlData = { root: { item: { name: 'User', tarjeta: '5111111111111111' } } };
            const result = convertXmlToListMap(xmlData, mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken)
                .toHaveBeenCalledWith('5111111111111111', mockSecretKey);
            expect(result[0]).toContainEqual({
                key: 'tarjeta',
                value: 'tokenized_5111111111111111'
            });
        });

        it('should throw for invalid XML format (multiple roots)', () => {
            const xmlData = { root1: {}, root2: {} };
            expect(() => convertXmlToListMap(xmlData, mockSecretKey))
                .toThrow('Invalid xml format');
        });

        it('should throw for XML parsing errors', () => {
            flattenObject.mockImplementationOnce(() => {
                throw new Error('Parsing error');
            });

            expect(() => convertXmlToListMap(mockXmlData, mockSecretKey))
                .toThrow('Parsing error');
        });
    });

    describe('convertCsvToListMap', () => {
        it('should convert CSV data to list map', () => {
            const result = convertCsvToListMap(mockCsvData, ',', mockSecretKey);

            expect(result).toEqual([
                [
                    { key: 'name', value: 'Test' },
                    { key: 'value', value: '123' },
                ],
            ]);
        });

        it('should handle quoted values in CSV', () => {
            const csvData = 'name,value\n"Test, Inc","123"';
            const result = convertCsvToListMap(csvData, ',', mockSecretKey);

            expect(result).toEqual([
                [
                    { key: 'name', value: 'Test, Inc' },
                    { key: 'value', value: '123' },
                ],
            ]);
        });

        it('should tokenize sensitive fields in CSV', () => {
            const csvData = "name,tarjeta\nUser,6111111111111111";
            const result = convertCsvToListMap(csvData, ',', mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken)
                .toHaveBeenCalledWith('6111111111111111', mockSecretKey);
            expect(result[0]).toContainEqual({
                key: 'tarjeta',
                value: 'tokenized_6111111111111111'
            });
        });

        it('should throw for CSV with no data rows', () => {
            expect(() => convertCsvToListMap("header1,header2", ',', mockSecretKey))
                .toThrow('CSV must have header and at least one row');
        });

        it('should use custom delimiter', () => {
            const csvData = "name|value\nTest|123";
            const result = convertCsvToListMap(csvData, '|', mockSecretKey);

            expect(result).toEqual([
                [
                    { key: 'name', value: 'Test' },
                    { key: 'value', value: '123' },
                ],
            ]);
        });
    });

    describe('convertTXTToListMap', () => {
        it('should convert TXT data using default delimiter', () => {
            const result = convertTXTToListMap(mockTxtData, ';', mockSecretKey);

            expect(result).toEqual([
                [
                    { key: 'name', value: 'Test' },
                    { key: 'value', value: '123' },
                ],
            ]);
        });

        it('should use custom delimiter', () => {
            const txtData = "name|value\nTest|123";
            const result = convertTXTToListMap(txtData, '|', mockSecretKey);

            expect(result).toEqual([
                [
                    { key: 'name', value: 'Test' },
                    { key: 'value', value: '123' },
                ],
            ]);
        });

        it('should tokenize sensitive fields in TXT', () => {
            const txtData = "name;tarjeta\nUser;7111111111111111";
            const result = convertTXTToListMap(txtData, ';', mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken)
                .toHaveBeenCalledWith('7111111111111111', mockSecretKey);
            expect(result[0]).toContainEqual({
                key: 'tarjeta',
                value: 'tokenized_7111111111111111'
            });
        });
    });
});