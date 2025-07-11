import { fileExists, readFileJson, readFileTxt, readFileXml, removeFile } from '../utils/fileHandler.util.js';
import { convertCsvToListMap, convertJsonToListMap, convertXmlToListMap } from '../utils/mappingData.util.js';
import { unflattenObject } from '../utils/objectFlatter.util.js';
import { convertDataToCvs, convertDataToJson, convertDataToTXT, convertDataToXML } from '../utils/dataParser.util.js';
import FILE_TYPES from '../utils/constants/fileTypes.constant.js';
import ServiceError from '../utils/errors/service.error.util.js';
import Upload from '../utils/errors/codes/upload.codes.js';
import tokenStrategies from '../utils/security/jwt.security.util.js';

const extractDataFromFiles = async (fileExtension, filePath, delimiter, secretKey) => {
    let data;
    switch (fileExtension.toLowerCase()) {
        case FILE_TYPES.JSON:
            data = await readFileJson(filePath);
            return convertJsonToListMap(data, secretKey);
        case FILE_TYPES.XML:
            data = await readFileXml(filePath);
            return convertXmlToListMap(data, secretKey);
        case FILE_TYPES.CSV:
            data = readFileTxt(filePath);
            return convertCsvToListMap(data, delimiter, secretKey);
        case FILE_TYPES.TXT:
            data = readFileTxt(filePath);
            return convertCsvToListMap(data, delimiter, secretKey);
        default: {
            if (fileExists(filePath))
                removeFile(filePath);
            throw new ServiceError(
                `Unsupported file type: ${fileExtension}`,
                Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED
            )

        }
    }

};

const dataConverterToFile = async (data, resultFileExtension, currentFileExtension, delimiter) => {
    switch (resultFileExtension.toLowerCase()) {
        case FILE_TYPES.JSON:
            return convertDataToJson(unflattenObject(data), currentFileExtension);
        case FILE_TYPES.XML:
            return convertDataToXML(unflattenObject(data), currentFileExtension);
        case FILE_TYPES.CSV:
            return convertDataToCvs(data, currentFileExtension, delimiter);
        case FILE_TYPES.TXT:
            return convertDataToTXT(data, currentFileExtension, delimiter);
        default:
            throw new ServiceError(
                `Unsupported file type: ${resultFileExtension}`,
                Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED
            );
    }
}

const isConvertionNeeded = (fileExtension, requestedConvertion) => {
    if (fileExtension.toLowerCase() === FILE_TYPES.TXT && requestedConvertion.toLowerCase() === FILE_TYPES.CSV)
        return false;
    if (fileExtension.toLowerCase() === FILE_TYPES.CSV && requestedConvertion.toLowerCase() === FILE_TYPES.TXT)
        return false;
    if (fileExtension.toLowerCase() === requestedConvertion.toLowerCase()) {
        return false;
    }

    return true;
}

const parseToNewFile = async (data) => {
    const content = await data; // Asegúrate de esperar la promesa
    return Buffer.from(content, 'utf-8').toString('base64');
};

const fileParserService = async (filePath, secretKey, fileType, delimiter) => {
    try {
        if (!fileExists(filePath)) {
            throw new ServiceError(`File not found please check path`, Upload.FILE_NOT_FOUND);
        }

        const fileExtension = filePath.split('.').pop().toLowerCase();

        if (!isConvertionNeeded(fileExtension, fileType)) {
            // console.log(`No conversion needed for file: ${filePath}`);
            return parseToNewFile(readFileTxt(filePath));
        }

        const result = await extractDataFromFiles(fileExtension, filePath, delimiter, secretKey);
        const processedResult = toggleCardEncryption(result, secretKey, decisionToEncrypt(fileExtension, fileType));
        const parsedData = await dataConverterToFile(processedResult, fileType, fileExtension, delimiter);
        // console.log('Parsed data:', parsedData);
        // console.log('Resulted object:', result);
        return parseToNewFile(parsedData);
    } catch (e) {
        // console.error(`Error processing file: ${filePath}`, e);
        throw new ServiceError(
            e.message || 'Error processing file',
            e.code || Upload.PROCESSINGFILE_ERROR,
        )
    } finally {
        if (fileExists(filePath))
            removeFile(filePath);
        console.log(`Temporary file removed: ${filePath}`);
    }
}

const decisionToEncrypt = (fileExtension, fileType) => {
    const from = fileExtension.toLowerCase();
    const to = fileType.toLowerCase();

    if (
        (from === FILE_TYPES.JSON && to === FILE_TYPES.XML) ||
        (from === FILE_TYPES.XML && to === FILE_TYPES.JSON)
    ) {
        return null;
    }

    const comesEncrypted = [FILE_TYPES.JSON, FILE_TYPES.XML].includes(from);
    const shouldEncrypt = [FILE_TYPES.JSON, FILE_TYPES.XML].includes(to);

    return !comesEncrypted && shouldEncrypt;
}

const toggleCardEncryption = (data, secretKey, shouldEncrypt) => {
    // console.log("shouldEncrypt:", shouldEncrypt);
    return data.map(entryArray => {
        return entryArray.map(item => {
            if (item.key === 'tarjeta' && shouldEncrypt !== null) {
                return {
                    ...item,
                    value: shouldEncrypt
                        ? tokenStrategies.JWT_TARGET_CODE.generateToken(item.value, secretKey).token
                        : tokenStrategies.JWT_TARGET_CODE.verifyToken(item.value, secretKey).payload
                };
            }
            return item;
        });
    });
};



export {
    fileParserService
}