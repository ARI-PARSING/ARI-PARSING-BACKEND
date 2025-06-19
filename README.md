# BACKEND

## Librerias utilizadas

El proyecto utiliza las siguientes librerías y herramientas para su funcionamiento:

- **Express** (^4.21.2): Framework web para Node.js.
- **jsonwebtoken (JWT)** (^9.0.2): Manejo de tokens para encriptacion de tarjetas.
- **dotenv** (^16.4.7): Para manejar las variables de entorno.
- **cors** (^2.8.5): Habilita la comunicación entre diferentes dominios.
- **express-validator** (^7.2.1): Librería para la validación de datos en Express.
- **http-errors** (^2.0.0): Para manejar y generar errores HTTP.
- **multer** (^2.0.0): Para manejo de archivos en body.
- **babel-jest**: (^30.0.0): Para usar Babel con Jest para ES Modules
- **jest**: (^30.0.0): Framework de testing para JavaScript
- **supertest**: (^7.1.1): Para probar endpoints HTTP (usado con Express)

## Requisitos previos

Antes de comenzar con la instalación, asegúrate de tener lo siguiente:

- **Node.js**: Necesitarás tener Node.js instalado. Puedes descargarlo e instalarlo desde [aquí](https://nodejs.org/es).

```bash
/mi-proyecto
├── /node_modules
├── /src
├── /public
├── .env.example
├── .env
└── README.md
```

## Instalacion

1. Clona el repositorio

```bash
git clone https://github.com/ARI-PARSING/ARI-PARSING-BACKEND.git
```

2. Ve al direcctorio del proyecto

```bash
cd ARI-PARSING-BACKEND
```

3. Instala las dependencias

```bash
npm install
```

## Configuracion de variables de entorno

Configuración el servidor

```
PORT= # Puerto donde se ejecutara la aplicacion .
```

# Uso

Instrucciones para arrancar el servidor:

Para iniciar el servidor en modo desarrollo:

1.

```bash
node server.js
```

2.

```bash
node --watch server.js
```
# Endpoint

El endpoint principal se detalla a continuacion:

- **Method:** `POST`
- **Path:** `/upload/send`
- **Descripcion**: Descripción:
Este endpoint permite la conversión de archivos entre los formatos CSV, TXT, JSON y XML.
Además de transformar el formato, aplica encriptación o desencriptación automática dependiendo del flujo de conversión:

De CSV o TXT a JSON o XML:
El contenido es convertido al nuevo formato y luego encripta el apartado de la tarjeta antes de la entrega.

De JSON o XML a CSV o TXT:
El contenido recibido se desencripta el apartado de la tarjeta y luego se transforma al nuevo formato deseado.

#### Ejemplo de solicitud

```json
{
  "file": "SPADMIN3",
  "key": "fasdkfalfj",
  "delimiter":";", //opcional segun el archivo que se envie
  "documentType":"csv" //archivo de salida que se desea 
}
```