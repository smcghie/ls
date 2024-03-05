import fetch from 'node-fetch';

type BigDataCloudResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
};

const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  const apiKey = process.env.BIGDATACLOUD_API_KEY;
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en&key=${apiKey}`;

  const response = await fetch(url);
  const data = (await response.json()) as BigDataCloudResponse;

  return data.locality || data.city || data.principalSubdivision || 'Location not found';
};

export default reverseGeocode;
