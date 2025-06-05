import { fileExists, readFileJson, readFileTxt, readFileXml, removeFile } from '../utils/fileHandler.util.js';
import { convertCsvToListMap, convertJsonToListMap, convertXmlToListMap } from '../utils/mappingData.util.js';
import { unflattenObject } from '../utils/objectFlatter.util.js';
import { convertDataToCvs, convertDataToJson, convertDataToTXT, convertDataToXML } from '../utils/dataParser.util.js';
import FILE_TYPES from '../utils/constants/fileTypes.constant.js';
import ServiceError from '../utils/errors/service.error.util.js';
import Upload from '../utils/errors/codes/upload.codes.js';
import { parse } from 'dotenv';

const extractDataFromFiles = async (filePath, secretKey) => {
    if (!fileExists(filePath)) {
        console.error(`File not found: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
    }

    const fileExtension = filePath.split('.').pop().toLowerCase();

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
            return convertCsvToListMap(data, ',', secretKey);
        case FILE_TYPES.TXT:
            data = readFileTxt(filePath);
            return convertCsvToListMap(data, ',', secretKey);
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

const dataConverterToFile = async (data, fileType, delimiter) => {
    const dataConverted = unflattenObject(data);
    switch (fileType.toLowerCase()) {
        case FILE_TYPES.JSON:
            return convertDataToJson(dataConverted);
        case FILE_TYPES.XML:
            return convertDataToXML(dataConverted);
        case FILE_TYPES.CSV:
            return convertDataToCvs(dataConverted, delimiter);
        case FILE_TYPES.TXT:
            return convertDataToTXT(dataConverted, delimiter);
        default:
            throw new ServiceError(
                `Unsupported file type: ${fileType}`,
                Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED
            );
    }
}

const isConvertionNeeded = (filePath, requestedConvertion) => {
    const fileExtension = filePath.split('.').pop().toLowerCase();
    if (fileExtension.toLowerCase() === requestedConvertion.toLowerCase()) {
        return false;
    }

    return true;
}

const parseToNewFile = (data) => {
    return Buffer.from(data, 'utf-8').toString('base64');
}

const fileParserService = async (filePath, secretKey, fileType, delimiter) => {
    try {
        if (!isConvertionNeeded(filePath, fileType)) {
            console.log(`No conversion needed for file: ${filePath}`);
            return parseToNewFile(readFileTxt(filePath));
        }

        const result = await extractDataFromFiles(filePath, delimiter);
        const parsedData = await dataConverterToFile(result, fileType, delimiter);
        console.log('Parsed data:', parsedData);
        console.log('Flattened object:', result);
        return parseToNewFile(parsedData);
    } catch (e) {
        console.error(`Error processing file: ${filePath}`, e);
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

export {
    fileParserService
}