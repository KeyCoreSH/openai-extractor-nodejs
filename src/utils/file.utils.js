const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3.config');
const { v4: uuidv4 } = require('uuid');

class FileUtils {
    static async uploadToS3(fileBuffer, originalFilename, folder) {
        const fileExtension = originalFilename.split('.').pop();
        const newFilename = `${uuidv4()}.${fileExtension}`;
        const key = `${folder}/${newFilename}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: key,
                Body: fileBuffer,
                ContentType: `application/${fileExtension}`
            })
        );

        return {
            filename: newFilename,
            key: key
        };
    }

    static isBase64(str) {
        try {
            return Buffer.from(str, 'base64').toString('base64') === str;
        } catch (err) {
            return false;
        }
    }

    static getFileType(base64String) {
        const base64Header = base64String.substring(0, 30);
        if (base64Header.includes('JVBERi0')) {
            return 'pdf';
        } else if (base64Header.includes('iVBORw0KGgo')) {
            return 'image';
        }
        return 'unknown';
    }
}

module.exports = FileUtils; 