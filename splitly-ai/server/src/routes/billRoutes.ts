import { Router, Request, Response } from 'express';
import multer from 'multer';
import { extractBillFromImage } from '../services/extractBillFromImage.js';

const router = Router();

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, JPEG, PNG, HEIC`));
    }
  },
});

router.post(
  '/extract-bill',
  upload.single('billImage'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
        return;
      }

      const { buffer, mimetype } = req.file;

      const bill = await extractBillFromImage(buffer, mimetype);

      res.json({
        success: true,
        data: bill,
      });
    } catch (error) {
      console.error('Bill extraction error:', error);

      const message = error instanceof Error ? error.message : 'Unknown extraction error';

      res.status(500).json({
        success: false,
        error: 'Failed to extract bill data',
        details: message,
      });
    }
  }
);

export default router;
