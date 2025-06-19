import { body, param } from "express-validator";
import FILE_TYPES from "../utils/constants/fileTypes.constant.js";

const fileExtensions = Object.values(FILE_TYPES)

const uploadValidator = [
    //Los valores validos para la key son: numeros, letras y  algunos caracteres especiales (.,;:!?"'@#%&()\-_/+=$).
  body("key")
    .notEmpty()
    .isString()
    .isLength({ min: 10, max: 20 })
    .withMessage(
      "La clave de encriptación es requerida y debe tener de 10 a 20 caracteres."
    )
    .matches(/^[A-Za-z0-9.,;:!?"'@#%&()\-_/+=$]*$/)
    .withMessage(
      "La clave de encriptación solo puede contener letras, números y algunos caracteres especiales."
    )
    .bail(),

    //Los valores validos para el campo "delimiter" son: coma, punto y coma, barra vertical o tabulación.
  body("delimiter")
    .optional()
    .isString()
    .isLength({ min: 1, max: 1 })
    .matches(/^[,;|\t]$/)
    .withMessage(
      "El delimitador debe ser una cadena de texto válida, como una coma, punto y coma, barra vertical o tabulación."
    )
    .bail(),

    //Los valores validos para el campo "documentType" son: csv, json o xml.
  body("documentType")
    .notEmpty()
    .isString()
    .isIn(fileExtensions)
    .withMessage(
      "El tipo de documento debe ser uno de los siguientes: csv, json, xml."
    )
    .bail(),

    //Los valores validos para el campo "pathFile" son: letras, números y algunos caracteres especiales( .,;:!?"'@#%&()\-_/+=$).
    //ejemplo: C:\Users\Usuario\Documents\archivo.txt o /home/usuario/documentos/archivo.txt
  // body("pathFile")
  //   .notEmpty()
  //   .isString()
  //   .isLength({ min: 1, max: 255 })
  //   .matches(/^(?:[a-zA-Z]:\\|\/)?(?:[\w\s.-]+[\/\\]?)*$/)
  //   .withMessage(
  //     "La ruta del archivo debe ser una cadena de texto válida y no puede estar vacía."
  //   )
  //   .bail(),
];

export {
  uploadValidator,
};
