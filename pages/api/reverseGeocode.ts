import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

type BigDataCloudResponse = {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
    localityInfo?: {
        administrative?: Array<{
          order?: number;
          name?: string;
          description?: string;
        }>;
      };
  };
  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { latitude, longitude } = req.query;

  const apiKey = process.env.BIGDATACLOUD_API_KEY;
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as BigDataCloudResponse;
    // if (data.localityInfo && data.localityInfo.administrative) {
    //     console.log("Administrative Info:", data.localityInfo.administrative);
    //   }
    //console.log("DATA: ", data);
    res.status(200).json({
        locality: data.locality || 'Locality not found',
        city: data.city || 'City not found',
        country: data.countryName || 'Country not found'
      });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching location data' });
  }
}
