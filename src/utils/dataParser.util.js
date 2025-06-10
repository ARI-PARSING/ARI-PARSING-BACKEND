import { polygonHandlerToCSV, polygonHandlerToJSON, polygonHandlerToXML } from "./polygon.util.js";

const convertDataToJson = (data, currentFileExtension) => {
    const transformed = Array.isArray(data)
        ? data.map(entry => ({
            ...entry,
            poligono: (typeof entry.poligono === 'string')
                ? polygonHandlerToJSON(entry.poligono, currentFileExtension)
                : entry.poligono
        }))
        : {
            ...data,
            poligono: (typeof data.poligono === 'string')
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
    const entries = array.map(item => `<cliente>${objectToXML(item, currentFileExtension)}</cliente>`);
    return `<clientes>${entries.join('')}</clientes>`;
};

const convertDataToCvs = (data, currentFileExtension, delimiter = ";") => {
    if (data.length === 0) return '';

    const headersSet = new Set();
    data.forEach(entry => entry.map(({ key, _ }) => {
        const k = key.toString().toLowerCase();
        if (!k.includes("poligono") || k.includes("coordinates")) {
            if (k.includes("coordinates"))
                headersSet.add("poligono");
            else
                headersSet.add(key)
        }

    }));
    const headers = [...headersSet];

    const rows = data.map(entry => {

        const entryMap = Object.fromEntries(entry.map(({ key, value }) => {
            const k = key.toString().toLowerCase();
            if (k.includes("poligono") && k.includes("coordinates")) {
                key = "poligono";
                value = polygonHandlerToCSV(key, value, currentFileExtension);
            }
            return [key, value];
        }));
        console.log('Entry Map:', entryMap);
        console.log('Headers:', headers);
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