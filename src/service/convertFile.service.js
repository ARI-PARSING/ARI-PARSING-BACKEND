import { fileExists, readFileJson, readFileTxt, readFileXml, removeFile } from '../utils/fileHandler.util.js';
import { convertCsvToListMap, convertJsonToListMap, convertXmlToListMap } from '../utils/mappingData.util.js';
import { convertDataToCvs, convertDataToJson, convertDataToTXT, convertDataToXML } from '../utils/dataParser.util.js';
import FILE_TYPES from '../utils/constants/fileTypes.constant.js';
import ServiceError from '../utils/errors/service.error.util.js';
import Upload from '../utils/errors/codes/upload.codes.js';

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
            removeFile(filePath);
            throw new ServiceError(
                `Unsupported file type: ${fileExtension}`,
                Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED
            )

        }
    }

};

const dataConverterToFile = async (data, fileType, delimiter) => {
    switch (fileType.toLowerCase()) {
        case FILE_TYPES.JSON:
            return convertDataToJson(data);
        case FILE_TYPES.XML:
            return convertDataToXML(data);
        case FILE_TYPES.CSV:
            return convertDataToCvs(data, delimiter);
        case FILE_TYPES.TXT:
            return convertDataToTXT(data, delimiter);
        default:
            throw new ServiceError(
                `Unsupported file type: ${fileType}`,
                Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED
            );
    }
}

const parseToNewFile = (data) => {
    return Buffer.from(data, 'utf-8').toString('base64');
}

const fileParserService = async (filePath, secretKey, fileType, delimiter) => {
    console.log(`Processing file: ${filePath}`);
    try {
        const result = await extractDataFromFiles(filePath, delimiter);
        const parsedData = await dataConverterToFile(result, fileType, delimiter);
        console.log(`File processed successfully: ${filePath}`);
        console.log('Encrypted targets in file:', result);
        console.log('Parsed data:', parsedData);
        return parseToNewFile(parsedData);
    } catch (e) {
        console.error(`Error processing file: ${filePath}`, e);
        throw new ServiceError(
            e.message || 'Error processing file',
            e.code || Upload.PROCESSINGFILE_ERROR,
        )
    } finally {
        removeFile(filePath);
        console.log(`Temporary file removed: ${filePath}`);
    }
}

export {
    fileParserService
}