const convertDataToJson = (data) => {
    const objects = data.map(entry =>
        Object.fromEntries(entry.map(({ key, value }) => [key, value]))
    );
    return JSON.stringify(objects, null, 2);

}

const convertDataToXML = (data) => {
    const entries = data.map(entry => {
        const fields = entry.map(({ key, value }) => `<${key}>${value}</${key}>`).join('');
        return `<item>${fields}</item>`;
    });
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