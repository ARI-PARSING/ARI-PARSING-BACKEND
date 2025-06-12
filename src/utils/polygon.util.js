import FILE_TYPES from "./constants/fileTypes.constant.js";


const polygonFromXMLTOCSV = (key, value) => {
    if (key === "poligono" && value.includes("POLYGON"))
        value = value.replace(/POLYGON\s*\(\((.*?)\)\)/g, '(($1))')
            .replace(/\s*\n\s*/g, '')
            .replace(/\s\s+/g, ' ')
            .trim();
    return value;
}

const polygonFromWKTtoGeoJSON = (wkt) => {
    if (typeof wkt !== 'string') return wkt;

    const match = wkt.match(/POLYGON\s*\(\(\s*(.*?)\s*\)\)/i) || wkt.match(/\(\(\s*(.*?)\s*\)/i);
    if (!match) return wkt;

    const coordinatePairs = match[1]
        .split(',')
        .map(pair => pair.trim().split(/\s+/))
        .map(pair => pair.map(coord => parseFloat(coord)));

    return {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: {
                name: "EPSG:4326"
            }
        },
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinatePairs]
                },
                properties: {
                    "Land Use": "I",
                }
            }
        ]
    };
};

const polygonFromGeoJSONToWKT = (value, currentFileType) => {
    const isObject = value === 'object' && value.features && value.features[0] && value.features[0].geometry && value.features[0].geometry.coordinates
    const valueCoordinates = isObject ? value.features[0].geometry.coordinates : value;

    const coordinates = valueCoordinates.map(coord => coord.join(' '));

    const needPolygon = currentFileType.toLowerCase() === FILE_TYPES.XML ? "POLYGON " : "";
    return `${needPolygon}((${coordinates}))`;
};

const polygonFromCSVToWKT = (value) => {
    if (typeof value !== 'string') return value;

    if (value.trim().toUpperCase().startsWith('POLYGON ((') && value.trim().endsWith('))')) {
        return value.trim();
    }

    const match = value.match(/\(\(\s*(.*?)\s*\)/);
    if (!match) return value;

    const coordinatePairs = match[1]
        .split(',')
        .map(pair => pair.trim().split(/\s+/));

    return `POLYGON ((${coordinatePairs.map(pair => pair.join(' ')).join(', ')}))`;
};

export const polygonHandlerToCSV = (key, value, currentFileType) => {
    switch (currentFileType.toLowerCase()) {
        case FILE_TYPES.XML:
            return polygonFromXMLTOCSV(key, value);
        case FILE_TYPES.JSON:
            return polygonFromGeoJSONToWKT(value, FILE_TYPES.CSV);
        default:
            throw new Error(`Unsupported file type: ${currentFileType}`);
    }
}

export const polygonHandlerToJSON = (value, currentFileType) => {
    switch (currentFileType.toLowerCase()) {
        case FILE_TYPES.XML:
        case FILE_TYPES.CSV:
        case FILE_TYPES.TXT:
            return polygonFromWKTtoGeoJSON(value);
        default:
            throw new Error(`Unsupported file type: ${currentFileType}`);
    }
}

export const polygonHandlerToXML = (value, currentFileExtension) => {
    switch (currentFileExtension.toLowerCase()) {
        case FILE_TYPES.JSON:
            return polygonFromGeoJSONToWKT(value, FILE_TYPES.XML);
        case FILE_TYPES.CSV:
        case FILE_TYPES.TXT:
            return polygonFromCSVToWKT(value);
        default:
            throw new Error(`Unsupported file type: ${currentFileExtension}`);
    }
}