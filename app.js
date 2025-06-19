import express from 'express';
import cors from 'cors';
import router from './src/routes/index.js';
import { errorHandler } from './src/handlers/error.handler.js';
import { initUploadFolder } from './src/configs/initFolders.config.js';


const app = express();

initUploadFolder();
app.use(cors(
    {
        origin: '*',
        methods: ['GET', 'POST'],
    }
));
app.use(express.json());
app.use(router)
app.use(errorHandler)


export default app;