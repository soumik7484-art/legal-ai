import express from 'express';
import multer from 'multer';
import userAuth from '../middleware/userAuth.js';
import {
  uploadAndAnalyze,
  getUserContracts,
  getContractDetails,
  chatWithContract,
  generalChat,
  deleteContract
} from '../controllers/contractController.js';

const contractRouter = express.Router();

// Configure multer for memory uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // limit file size to 10MB
  }
});

// Define contract endpoints
contractRouter.post('/upload', userAuth, upload.single('file'), uploadAndAnalyze);
contractRouter.get('/', userAuth, getUserContracts);
contractRouter.get('/:id', userAuth, getContractDetails);
contractRouter.post('/:id/chat', userAuth, chatWithContract);
contractRouter.post('/general-chat', userAuth, generalChat);
contractRouter.delete('/:id', userAuth, deleteContract);

export default contractRouter;
