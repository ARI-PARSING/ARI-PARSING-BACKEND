const convertDataToJson = (data) =>
    JSON.stringify(data, null, 2);


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

const convertDataToCvs = (data, delimiter = ";") => {
    if (data.length === 0) return '';

    const headers = data[0].map(({ key }) => key);
    const rows = data.map(entry =>
        entry.map(({ value }) => `"${value}"`).join(delimiter)
    );

    return [headers.join(delimiter), ...rows].join('\n');
}

const convertDataToTXT = (data, delimiter) => {
    if (data.length === 0) return '';

    const headers = data[0].map(({ key }) => key);
    const rows = data.map(entry =>
        entry.map(({ value }) => `"${value}"`).join(delimiter)
    );

    return [headers.join(delimiter), ...rows].join('\n');
}

export {
    convertDataToJson,
    convertDataToXML,
    convertDataToCvs,
    convertDataToTXT
}