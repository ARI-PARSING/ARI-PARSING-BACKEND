
import { flattenObject } from './objectFlatter.util.js';

const flattenToKeyValueList = (entries) => {
    const flattenInformation = flattenObject(entries);
    return Object.entries(flattenInformation).map(([key, value]) => ({
        key,
        value
    }))
}

const convertJsonToListMap = (data,) => {
    if (!Array.isArray(data)) {
        return [flattenToKeyValueList(data)];
    }
    else return data.map(item => flattenToKeyValueList(item));
}

const convertXmlToListMap = (data) => {
    const rootValues = Object.values(data);
    if (rootValues.length !== 1) throw new Error('Invalid xml format');

    const root = rootValues[0];
    const entityList = Object.values(root)[0];

    const list = Array.isArray(entityList) ? entityList : [entityList];

    return list.map(item => flattenToKeyValueList(item));
}

const convertCsvToListMap = (data, delimiter = ",") => {
    const lines = data.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV must have header and at least one row');

    const headers = lines[0].split(delimiter).map(h => h.trim());
    // console.log("Aca esta este pedo volando pija")
    return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        return headers.map((key, i) => ({
            key,
            value: values[i]
        }));
    });
}

const convertTXTToListMap = (data, delimiter = ";",) => convertCsvToListMap(data, delimiter);

export {
    convertJsonToListMap,
    convertXmlToListMap,
    convertCsvToListMap,
    convertTXTToListMap
}