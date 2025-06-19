import fs from "fs";
import { XMLParser } from "fast-xml-parser";

const fileExists = (file) => {
    return fs.existsSync(file);
}

const readFile = (file) => {
    if (!fileExists(file))
        return null;

    return fs.readFileSync(file, "utf8");
}

const readFileJson = (file) => {
    if (!fileExists(file))
        return null;

    return JSON.parse(readFile(file));
}

const readFileXml = (file) => {
    if (!fileExists(file))
        return null;

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
    });
    return parser.parse(readFile(file));
}

const removeFile = (file) => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
    return true;
}

export {
    fileExists,
    readFile as readFileTxt,
    readFileJson,
    readFileXml,
    removeFile
};