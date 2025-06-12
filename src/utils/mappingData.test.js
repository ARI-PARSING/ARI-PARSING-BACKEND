import { convertJsonToListMap, convertXmlToListMap, convertCsvToListMap, convertTXTToListMap } from './mappingData.util.js';
import { flattenObject } from './objectFlatter.util.js';
import tokenStrategies from './security/jwt.security.util.js';

// Mock dependencies
jest.mock('./objectFlatter.util.js', () => ({
    flattenObject: jest.fn(),
}));

jest.mock('./security/jwt.security.util.js', () => ({
    JWT_TARGET_CODE: {
        generateToken: jest.fn(),
    },
}));

const mockSecretKey = 'test-secret';

describe('mappingData.util.js', () => {
    beforeEach(() => {
        // Reset mocks before each test
        flattenObject.mockReset(); // Use mockReset to clear implementations too
        tokenStrategies.JWT_TARGET_CODE.generateToken.mockClear(); // or .mockReset() if it's also a jest.fn()
    });

    // --- convertJsonToListMap ---
    describe('convertJsonToListMap', () => {
        it('should convert a single JSON object to list map', () => {
            const jsonData = { name: 'John', age: 30 };
            const flattened = { 'name': 'John', 'age': 30 };
            flattenObject.mockReturnValue(flattened);

            const result = convertJsonToListMap(jsonData, mockSecretKey);

            expect(flattenObject).toHaveBeenCalledWith(jsonData);
            expect(result).toEqual([
                [
                    { key: 'name', value: 'John' },
                    { key: 'age', value: 30 },
                ],
            ]);
        });

        it('should convert an array of JSON objects to list map', () => {
            const jsonArray = [{ id: 1 }, { id: 2 }];
            flattenObject.mockImplementation(item => item); // Simplified mock for this case

            const result = convertJsonToListMap(jsonArray, mockSecretKey);

            expect(flattenObject).toHaveBeenCalledTimes(2);
            expect(result[0]).toEqual([{ key: 'id', value: 1 }]);
            expect(result[1]).toEqual([{ key: 'id', value: 2 }]);
        });

        it('should tokenize "tarjeta" field in JSON conversion', () => {
            const jsonData = { name: 'User', tarjeta: '1234567890' };
            const flattened = { 'name': 'User', 'tarjeta': '1234567890' };
            flattenObject.mockReturnValue(flattened);
            tokenStrategies.JWT_TARGET_CODE.generateToken.mockReturnValue({ token: 'tokenized_card_data' });

            const result = convertJsonToListMap(jsonData, mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken).toHaveBeenCalledWith('1234567890', mockSecretKey);
            expect(result[0]).toContainEqual({ key: 'tarjeta', value: 'tokenized_card_data' });
        });
    });

    // --- convertXmlToListMap ---
    describe('convertXmlToListMap', () => {
        it('should convert valid XML data to list map', () => {
            const xmlData = { root: { item: { name: 'Product', price: 100 } } };
            const flattened = { 'name': 'Product', 'price': 100 };
            flattenObject.mockReturnValue(flattened);

            const result = convertXmlToListMap(xmlData, mockSecretKey);
            expect(flattenObject).toHaveBeenCalledWith({ name: 'Product', price: 100 });
            expect(result[0]).toEqual([
                { key: 'name', value: 'Product' },
                { key: 'price', value: 100 },
            ]);
        });

        it('should convert XML data with multiple items in an array to list map', () => {
            const xmlData = { root: { item: [{ name: 'ProductA' }, { name: 'ProductB' }] } };
            flattenObject.mockImplementation(item => item); // Simplified

            const result = convertXmlToListMap(xmlData, mockSecretKey);
            expect(flattenObject).toHaveBeenCalledTimes(2);
            expect(result[0]).toEqual([{ key: 'name', value: 'ProductA' }]);
            expect(result[1]).toEqual([{ key: 'name', value: 'ProductB' }]);
        });

        it('should tokenize "tarjeta" field in XML conversion', () => {
            const xmlData = { root: { item: { name: 'User', tarjeta: '1234567890' } } };
            const flattened = { 'name': 'User', 'tarjeta': '1234567890' };
            flattenObject.mockReturnValue(flattened);
            tokenStrategies.JWT_TARGET_CODE.generateToken.mockReturnValue({ token: 'tokenized_xml_card' });

            const result = convertXmlToListMap(xmlData, mockSecretKey);
            expect(tokenStrategies.JWT_TARGET_CODE.generateToken).toHaveBeenCalledWith('1234567890', mockSecretKey);
            expect(result[0]).toContainEqual({ key: 'tarjeta', value: 'tokenized_xml_card' });
        });

        it('should throw error for invalid XML format (no single root)', () => {
            const xmlData = { root1: {}, root2: {} };
            expect(() => convertXmlToListMap(xmlData, mockSecretKey)).toThrow('Invalid xml format');
        });

        it('should throw error for invalid XML format (empty root)', () => {
            flattenObject.mockImplementationOnce(() => {
                throw new Error('Test error from mock');
            });
            expect(() => convertXmlToListMap(xmlData, mockSecretKey)).toThrow('Test error from mock');
        });
    });

    // --- convertCsvToListMap ---
    describe('convertCsvToListMap', () => {
        it('should convert CSV data to list map', () => {
            const csvData = "header1,header2\nvalue1,value2";
            const result = convertCsvToListMap(csvData, ",", mockSecretKey);
            expect(result).toEqual([
                [
                    { key: 'header1', value: 'value1' },
                    { key: 'header2', value: 'value2' },
                ],
            ]);
        });

        it('should handle CSV data with quotes', () => {
            const csvData = 'header1,header2\n"value1","value2"';
            const result = convertCsvToListMap(csvData, ",", mockSecretKey);
            expect(result).toEqual([
                [
                    { key: 'header1', value: 'value1' },
                    { key: 'header2', value: 'value2' },
                ],
            ]);
        });

        it('should tokenize "tarjeta" field in CSV', () => {
            const csvData = "name,tarjeta\nUser,12345";
            tokenStrategies.JWT_TARGET_CODE.generateToken.mockReturnValue({ token: 'tokenized_csv_card' });

            const result = convertCsvToListMap(csvData, ",", mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken).toHaveBeenCalledWith('12345', mockSecretKey);
            expect(result[0]).toContainEqual({ key: 'tarjeta', value: 'tokenized_csv_card' });
        });

        it('should throw error for CSV with no data rows', () => {
            const csvData = "header1,header2";
            expect(() => convertCsvToListMap(csvData, ",", mockSecretKey)).toThrow('CSV must have header and at least one row');
        });

        it('should throw error for empty CSV input', () => {
            const csvData = "";
            expect(() => convertCsvToListMap(csvData, ",", mockSecretKey)).toThrow('CSV must have header and at least one row');
        });

        it('should use provided delimiter for CSV', () => {
            const csvData = "header1;header2\nvalue1;value2";
            const result = convertCsvToListMap(csvData, ";", mockSecretKey);
            expect(result).toEqual([
                [
                    { key: 'header1', value: 'value1' },
                    { key: 'header2', value: 'value2' },
                ],
            ]);
        });
    });

    // --- convertTXTToListMap ---
    describe('convertTXTToListMap', () => {
        // convertTXTToListMap is just a wrapper for convertCsvToListMap with a default delimiter
        it('should convert TXT data using default ";" delimiter', () => {
            const txtData = "h1;h2\nval1;val2";
            const result = convertTXTToListMap(txtData, ";", mockSecretKey); // Explicitly pass delimiter for clarity in test
            expect(result).toEqual([
                [
                    { key: 'h1', value: 'val1' },
                    { key: 'h2', value: 'val2' },
                ],
            ]);
        });

        it('should convert TXT data using specified delimiter', () => {
            const txtData = "h1|h2\nval1|val2";
            const result = convertTXTToListMap(txtData, "|", mockSecretKey);
            expect(result).toEqual([
                [
                    { key: 'h1', value: 'val1' },
                    { key: 'h2', value: 'val2' },
                ],
            ]);
        });

        it('should tokenize "tarjeta" field in TXT', () => {
            const txtData = "name;tarjeta\nUser;123456";
            tokenStrategies.JWT_TARGET_CODE.generateToken.mockReturnValue({ token: 'tokenized_txt_card' });

            const result = convertTXTToListMap(txtData, ";", mockSecretKey);

            expect(tokenStrategies.JWT_TARGET_CODE.generateToken).toHaveBeenCalledWith('123456', mockSecretKey);
            expect(result[0]).toContainEqual({ key: 'tarjeta', value: 'tokenized_txt_card' });
        });
    });
});
