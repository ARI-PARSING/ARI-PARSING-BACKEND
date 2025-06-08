
import { flattenObject } from './objectFlatter.util.js';
import tokenStrategies from './security/jwt.security.util.js';

const flattenToKeyValueList = (entries, secretKey) => {
    const flattenInformation = flattenObject(entries);
    return Object.entries(flattenInformation).map(([key, value]) => ({
        key,
        value: key === "tarjeta"
            ? tokenStrategies.JWT_TARGET_CODE.generateToken(value, secretKey).token
            : value,
    }));
}

const convertJsonToListMap = (data, secretKey) => {
    if (!Array.isArray(data)) {
        return [flattenToKeyValueList(data, secretKey)];
    }
    else return data.map(item => flattenToKeyValueList(item, secretKey));
}

const convertXmlToListMap = (data, secretKey) => {
    const rootValues = Object.values(data);
    if (rootValues.length !== 1) throw new Error('Invalid xml format');

    const root = rootValues[0];
    const entityList = Object.values(root)[0];

    const list = Array.isArray(entityList) ? entityList : [entityList];

    return list.map(item => flattenToKeyValueList(item, secretKey));
}

const convertCsvToListMap = (data, delimiter = ",", secretKey) => {
    const lines = data.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV must have header and at least one row');

    const headers = lines[0].split(delimiter).map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        return headers.map((key, i) => ({
            key,
            value: key === "tarjeta" ? tokenStrategies.JWT_TARGET_CODE.generateToken(values[i], secretKey).token :
                typeof values[i] === 'string' ? values[i].replace(/^"|"$/g, '') : values[i]
        }));
    });
}

const convertTXTToListMap = (data, delimiter = ";", secretKey) => convertCsvToListMap(data, delimiter, secretKey);

export {
    convertJsonToListMap,
    convertXmlToListMap,
    convertCsvToListMap,
    convertTXTToListMap
}