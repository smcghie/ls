import sharp from 'sharp';

export const compressImage = async (
  filePath: string,
  maxWidth: number,
  maxHeight: number,
  shouldResize: boolean
): Promise<Buffer> => {
  let pipeline = sharp(filePath)
    .rotate(); 

  if (shouldResize) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
    });
  }

  const outputBuffer = await pipeline.jpeg({ quality: 80 }).toBuffer();
  return outputBuffer;
};