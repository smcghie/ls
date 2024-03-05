// import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// const s3Client = new S3Client({
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
//   },
//   region: process.env.AWS_REGION ?? '',
// });

// export default async function handler(req: any, res: any): Promise<void> {
//   if (req.method === 'GET') {
//     try {
//       const key: string = req.query.key as string;

//       const command = new GetObjectCommand({
//         Bucket: process.env.AWS_S3_AVATAR_BUCKET_NAME ?? '',
//         Key: key,
//       });

//       const presignedUrl = await getSignedUrl(s3Client, command, {
//         expiresIn: 600, 
//       });

//       res.status(200).json({ presignedUrl });
//     } catch (error) {
//       console.error('Error generating presigned URL:', error);
//       res.status(500).json({ error: 'Error generating presigned URL' });
//     }
//   } else {
//     res.setHeader('Allow', ['GET']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }

import AWS from 'aws-sdk';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const { key } = req.query;

      if (!process.env.CLOUDFRONT_PRIVATE_KEY || !process.env.CLOUDFRONT_KEY_PAIR_ID || !process.env.CLOUDFRONT_DOMAIN_NAME) {
        throw new Error('CloudFront environment variables are not set');
      }

      const privateKeyString = process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n');
      const signer = new AWS.CloudFront.Signer(process.env.CLOUDFRONT_KEY_PAIR_ID, privateKeyString);

      const url = `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/avatars/${encodeURIComponent(key)}`;
      const expires = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);

      const presignedUrl = signer.getSignedUrl({
        url,
        expires,
      });

      res.status(200).json({ presignedUrl });
    } catch (error) {
      console.error('Error generating CloudFront presigned URL:', error);
      res.status(500).json({ error: 'Error generating CloudFront presigned URL' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
