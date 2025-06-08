import { polygonHandlerToCSV, polygonHandlerToJSON } from "./polygon.util.js";

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


const objectToXML = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    return Object.entries(obj).map(([key, value]) => {
        if (Array.isArray(value)) {
            return value.map(item => `<${key}>${objectToXML(item)}</${key}>`).join('');
        } else if (typeof value === 'object') {
            return `<${key}>${objectToXML(value)}</${key}>`;
        } else {
            return `<${key}>${value}</${key}>`;
        }
    }).join('');
};

const convertDataToXML = (data) => {
    const array = Array.isArray(data) ? data : [data];
    const entries = array.map(item => `<item>${objectToXML(item)}</item>`);
    return `<root>${entries.join('')}</root>`;
}

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