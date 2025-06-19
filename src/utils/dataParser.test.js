import { convertDataToJson, convertDataToXML, convertDataToCvs, convertDataToTXT, } from './dataParser.util.js';
import { polygonHandlerToJSON, polygonHandlerToXML,polygonHandlerToCSV, } from './polygon.util.js';

// Mock polygon.util.js
jest.mock('./polygon.util.js', () => ({
    polygonHandlerToJSON: jest.fn(),
    polygonHandlerToXML: jest.fn(),
    polygonHandlerToCSV: jest.fn(),
}));

describe('dataParser.util.js', () => {
    const mockCurrentFileExtension = 'txt';

    beforeEach(() => {
        polygonHandlerToJSON.mockReset();
        polygonHandlerToXML.mockReset();
        polygonHandlerToCSV.mockReset();
    });

    // --- convertDataToJson ---
    describe('convertDataToJson', () => {
        it('should convert a single object to JSON string', () => {
            const data = { name: 'John', age: 30 };
            const expectedJson = JSON.stringify(data, null, 2);
            expect(convertDataToJson(data, mockCurrentFileExtension)).toBe(expectedJson);
        });

        it('should convert an array of objects to JSON string', () => {
            const data = [{ name: 'John' }, { name: 'Jane' }];
            const expectedJson = JSON.stringify(data, null, 2);
            expect(convertDataToJson(data, mockCurrentFileExtension)).toBe(expectedJson);
        });

        it('should call polygonHandlerToJSON for "poligono" field if it is a string', () => {
            const data = { id: 1, poligono: 'somePolygonData' };
            polygonHandlerToJSON.mockReturnValue('processedPolygonJSON');

            const result = JSON.parse(convertDataToJson(data, mockCurrentFileExtension));

            expect(polygonHandlerToJSON).toHaveBeenCalledWith('somePolygonData', mockCurrentFileExtension);
            expect(result.poligono).toBe('processedPolygonJSON');
        });

        it('should not call polygonHandlerToJSON if "poligono" is not a string', () => {
            const data = { id: 1, poligono: { type: 'Polygon', coordinates: [] } };
            convertDataToJson(data, mockCurrentFileExtension);
            expect(polygonHandlerToJSON).not.toHaveBeenCalled();
        });

        it('should handle array of objects with "poligono" field', () => {
            const data = [
                { id: 1, poligono: 'poly1' },
                { id: 2, poligono: { type: 'Polygon' } }
            ];
            polygonHandlerToJSON.mockImplementation((val) => val === 'poly1' ? 'processed_poly1' : val);

            const result = JSON.parse(convertDataToJson(data, mockCurrentFileExtension));

            expect(polygonHandlerToJSON).toHaveBeenCalledWith('poly1', mockCurrentFileExtension);
            expect(result[0].poligono).toBe('processed_poly1');
            expect(result[1].poligono).toEqual({ type: 'Polygon' });
        });
    });

    // --- convertDataToXML ---
    describe('convertDataToXML', () => {
        it('should convert a single object to XML string', () => {
            const data = { name: 'John', age: 30 };
            // Basic structure check, exact XML string can be complex
            const result = convertDataToXML(data, mockCurrentFileExtension);
            expect(result).toMatch(/<clientes><cliente><name>John<\/name><age>30<\/age><\/cliente><\/clientes>/);
        });

        it('should convert an array of objects to XML string', () => {
            const data = [{ name: 'John' }, { name: 'Jane' }];
            const result = convertDataToXML(data, mockCurrentFileExtension);
            expect(result).toMatch(/<clientes><cliente><name>John<\/name><\/cliente><cliente><name>Jane<\/name><\/cliente><\/clientes>/);
        });

        it('should call polygonHandlerToXML for "poligono" field', () => {
            const data = { name: 'Place', poligono: 'polygonWKT_data' };
            polygonHandlerToXML.mockReturnValue('<gml:Polygon>...</gml:Polygon>');

            const result = convertDataToXML(data, mockCurrentFileExtension);

            expect(polygonHandlerToXML).toHaveBeenCalledWith('polygonWKT_data', mockCurrentFileExtension);
            expect(result).toContain('<poligono><gml:Polygon>...</gml:Polygon></poligono>');
        });

        it('should handle nested objects in XML', () => {
            const data = { user: { name: 'Test', details: { id: 'D1' } } };
            const result = convertDataToXML(data, mockCurrentFileExtension);
            expect(result).toContain('<user><name>Test</name><details><id>D1</id></details></user>');
        });

        it('should handle arrays within objects in XML', () => {
            const data = { order: { items: [{ id: 1 }, { id: 2 }] } };
            const result = convertDataToXML(data, mockCurrentFileExtension);
            // The current objectToXML implementation might produce <items><id>1</id></items><items><id>2</id></items>
            // This test will depend on the exact output logic for arrays.
            expect(result).toContain('<items><id>1</id></items><items><id>2</id></items>');
        });
    });

    // --- convertDataToCvs ---
    describe('convertDataToCvs', () => {
        const sampleCsvData = [
            [{ key: 'name', value: 'John' }, { key: 'age', value: '30' }],
            [{ key: 'name', value: 'Jane' }, { key: 'age', value: '28' }],
        ];

        it('should convert data to CSV string with default delimiter', () => {
            const expectedCsv = 'name;age\n"John";"30"\n"Jane";"28"';
            const result = convertDataToCvs(sampleCsvData, mockCurrentFileExtension);
            // Order of headers might vary due to Set usage, so check parts
            expect(result).toContain('name;age'); // or age;name
            expect(result).toContain('"John";"30"');
            expect(result).toContain('"Jane";"28"');
        });

        it('should convert data to CSV string with specified delimiter', () => {
            const expectedCsv = 'name,age\n"John","30"\n"Jane","28"';
            const result = convertDataToCvs(sampleCsvData, mockCurrentFileExtension, ',');
            expect(result).toContain('name,age'); // or age,name
            expect(result).toContain('"John","30"');
            expect(result).toContain('"Jane","28"');
        });

        it('should call polygonHandlerToCSV for "poligono" fields', () => {
            const dataWithPolygon = [
                [{ key: 'id', value: '1' }, { key: 'poligono_coordinates', value: 'poly_coords_1' }],
                [{ key: 'id', value: '2' }, { key: 'poligono', value: 'poly_data_2' }]
            ];
            polygonHandlerToCSV.mockImplementation((key, value) => `processed_${value}`);

            convertDataToCvs(dataWithPolygon, mockCurrentFileExtension);

            expect(polygonHandlerToCSV).toHaveBeenCalledWith('poligono', 'poly_coords_1', mockCurrentFileExtension);
            expect(polygonHandlerToCSV).toHaveBeenCalledWith('poligono', 'poly_data_2', mockCurrentFileExtension);
        });

        it('should produce correct headers, including a single "poligono" for relevant fields', () => {
            const data = [
                [{ key: 'id', value: '1' }, { key: 'poligono_object_info', value: 'info' }, { key: 'poligono_coordinates', value: 'coords' }]
            ];
            const result = convertDataToCvs(data, mockCurrentFileExtension, ';');
            const headers = result.split('\n')[0];
            expect(headers).toContain('id');
            expect(headers).toContain('poligono');
            expect(headers).not.toContain('poligono_coordinates');
            expect(headers).not.toContain('poligono_object_info');
        });

        it('should return empty string for empty data array', () => {
            expect(convertDataToCvs([], mockCurrentFileExtension)).toBe('');
        });
    });

    // --- convertDataToTXT ---
    describe('convertDataToTXT', () => {
        // This function is a wrapper around convertDataToCvs
        it('should call convertDataToCvs with provided data and delimiter (defaulting to ";")', () => {
            const sampleTxtData = [
                [{ key: 'name', value: 'John' }, { key: 'val', value: '100' }],
            ];
            const expectedTxt = 'name;val\n"John";"100"';
            const result = convertDataToTXT(sampleTxtData, mockCurrentFileExtension, ';');


            // Check parts due to header order variability
            const resultLines = result.split('\n');
            expect(resultLines[0]).toMatch(/^(name;val|val;name)$/);
            expect(resultLines[1]).toBe('"John";"100"');
        });
    });
});