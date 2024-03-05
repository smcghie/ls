import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  region: process.env.AWS_REGION ?? '',
});

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === 'GET') {
    try {
      const filename: string = req.query.filename as string;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME ?? '',
        Key: `images/${filename}`,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 600, 
      });

      res.status(200).json({ presignedUrl });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      res.status(500).json({ error: 'Error generating presigned URL' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}



// import AWS from 'aws-sdk';

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// export default async function handler(req: any, res: any) {
//   if (req.method === 'GET') {
//     const { filename } = req.query;

//     const presignedUrl = s3.getSignedUrl('putObject', {
//       Bucket: process.env.AWS_S3_BUCKET_NAME,
//       Key: filename,
//       Expires: 60,
//     });

//     return res.status(200).json({ presignedUrl });
//   } else {
//     res.setHeader('Allow', ['GET']);
//     return res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
