import axios from 'axios';

const PINATA_API_KEY = process.env.PINATA_API_KEY!;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY!;
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY!;

export async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({ name: file.name }));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      maxBodyLength: Infinity,
    }
  );

  return response.data.IpfsHash;
}

export async function uploadJsonToPinata(data: object, name: string): Promise<string> {
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: data,
      pinataMetadata: { name },
      pinataOptions: { cidVersion: 1 },
    },
    {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.IpfsHash;
}

export function getIPFSUrl(hash: string): string {
  return `${GATEWAY}/ipfs/${hash}`;
}

export function isImageFile(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(filename);
}

export function isPDFFile(filename: string): boolean {
  return /\.pdf$/i.test(filename);
}