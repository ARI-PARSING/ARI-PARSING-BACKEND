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

    const match = wkt.match(/POLYGON\s*\(\(\s*(.*?)\s*\)\)/i) || wkt.match(/\(\s*(.*?)\s*\)/i);
    if (!match) return wkt; // No es un POLYGON válido

    const coordinatePairs = match[1]
        .split(',')
        .map(pair => pair.trim().split(/\s+/))

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

export const polygonHandlerToCSV = (key, value, currentFileType) => {
    switch (currentFileType.toLowerCase()) {
        case FILE_TYPES.XML:
            return polygonFromXMLTOCSV(key, value);
        case FILE_TYPES.JSON:
            polygonFromWKTtoGeoJSON(key, value);
            break;
        default:
            throw new Error(`Unsupported file type: ${currentFileType}`);
    }
}

export const polygonHandlerToJSON = (value, currentFileType) => {
    switch (currentFileType.toLowerCase()) {
        case FILE_TYPES.XML || FILE_TYPES.CSV || FILE_TYPES.TXT:
            return polygonFromWKTtoGeoJSON(value);
        default:
            throw new Error(`Unsupported file type: ${currentFileType}`);
    }
}
