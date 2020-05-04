import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

const fileDirectory = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: fileDirectory,
  storage: multer.diskStorage({
    destination: fileDirectory,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
