import { polygonHandlerToCSV, polygonHandlerToJSON, polygonHandlerToXML } from "./polygon.util.js";

const convertDataToJson = (data, currentFileExtension) => {
    const transformed = Array.isArray(data)
        ? data.map(entry => ({
            ...entry,
            poligono: (typeof entry.poligono === 'string' && entry.poligono.includes('POLYGON'))
                ? polygonHandlerToJSON(entry.poligono, currentFileExtension)
                : entry.poligono
        }))
        : {
            ...data,
            poligono: (typeof data.poligono === 'string' && data.poligono.includes('POLYGON'))
                ? polygonHandlerToJSON(data.poligono, currentFileExtension)
                : data.poligono
        };

    return JSON.stringify(transformed, null, 2);
}



const objectToXML = (value, currentFileExtension) => {
    if (typeof value !== 'object' || value === null) return value;

    return Object.entries(value).map(([key, value]) => {
        if (key.toLowerCase() === 'poligono') {
            try {
                const wkt = polygonHandlerToXML(value, currentFileExtension);
                return `<${key}>${wkt}</${key}>`;
            } catch (e) {
                console.warn(`Error procesando polígono para XML: ${e.message}`);
                return `<${key}></${key}>`; // valor vacío o maneja como desees
            }
        }
        if (Array.isArray(value)) {
            return value.map(item => `<${key}>${objectToXML(item, currentFileExtension)}</${key}>`).join('');
        } else if (typeof value === 'object') {
            return `<${key}>${objectToXML(value, currentFileExtension)}</${key}>`;
        } else {
            return `<${key}>${value}</${key}>`;
        }
    }).join('');
};

const convertDataToXML = (data, currentFileExtension) => {
    const array = Array.isArray(data) ? data : [data];
    const entries = array.map(item => `<item>${objectToXML(item, currentFileExtension)}</item>`);
    return `<root>${entries.join('')}</root>`;
};

const convertDataToCvs = (data, currentFileExtension, delimiter = ";") => {
    console.log(data)
    if (data.length === 0) return '';

    const headersSet = new Set();
    data.forEach(entry => entry.map(({ key, _ }) => headersSet.add(key)));
    const headers = [...headersSet];

    const rows = data.map(entry => {

        const entryMap = Object.fromEntries(entry.map(({ key, value }) => {
            if (key.toString().toLowerCase() === "poligono") {
                value = polygonHandlerToCSV(key, value, currentFileExtension);
            }
            return [key, value];
        }));
        return headers.map(header => `"${entryMap[header] ?? ''}"`).join(delimiter);
    });

    return [headers.join(delimiter), ...rows].join('\n');
};

const convertDataToTXT = (data, delimiter = ";") => convertDataToCvs(data, delimiter);

export {
    convertDataToJson,
    convertDataToXML,
    convertDataToCvs,
    convertDataToTXT
}