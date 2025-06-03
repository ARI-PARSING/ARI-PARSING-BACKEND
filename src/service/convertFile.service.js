import { fileExists, readFileJson, readFileTxt, readFileXml, removeFile } from '../utils/fileHandler.util.js';
import { convertCsvToListMap, convertJsonToListMap, convertXmlToListMap } from '../utils/mappingData.util.js';
import FILE_TYPES from '../utils/constants/fileTypes.constant.js';
import tokenStrategies from '../utils/security/jwt.security.util.js';
import ServiceError from '../utils/errors/service.error.util.js';
import Upload from '../utils/errors/codes/upload.codes.js';

const fileConverter = async (filePath, fileType) => {
    if (!fileExists(filePath)) {
        console.error(`File not found: ${filePath}`);
        throw new Error(`File not found: ${filePath}`);
    }

    const fileExtension = filePath.split('.').pop().toLowerCase();

    let data;
    switch (fileExtension.toLowerCase()) {
        case FILE_TYPES.JSON:
            data = await readFileJson(filePath);
            return convertJsonToListMap(data);
        case FILE_TYPES.XML:
            data = await readFileXml(filePath);
            return convertXmlToListMap(data);
        case FILE_TYPES.CSV:
            data = readFileTxt(filePath);
            return convertCsvToListMap(data, ',');
        case FILE_TYPES.TXT:
            data = readFileTxt(filePath);
            return convertCsvToListMap(data, ',');
        default: {
            removeFile(filePath);
            throw new ServiceError(
                `Unsupported file type: ${fileExtension}`,
                Upload.UPLOAD_FILE_TYPE_NOT_SUPPORTED
            )

        }
    }

};

const enryptedTargets = (file, secretKey) => {
    for (const register of file) {
        for (const item of register) {
            if (item.key == "tarjeta")
                item.value = tokenStrategies.JWT_TARGET_CODE.generateToken(item.value, secretKey).token;
        }
    }
    return file;
}

const fileLogs = async (filePath, secretKey) => {
    console.log(`Processing file: ${filePath}`);
    try {
        const result = await fileConverter(filePath);
        const encryptedResult = enryptedTargets(result, secretKey);
        console.log('Encrypted targets in file:', encryptedResult);
        console.log(`File processed successfully: ${filePath}`);
        return encryptedResult;
    } catch (e) {
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
    fileConverter,
    fileLogs
}