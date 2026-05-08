import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const pinataForm = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    pinataForm.append('file', blob, file.name);
    pinataForm.append('pinataMetadata', JSON.stringify({ name: file.name }));
    pinataForm.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataForm,
      {
        headers: {
          pinata_api_key: process.env.PINATA_API_KEY!,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY!,
        },
        maxBodyLength: Infinity,
      }
    );

    return NextResponse.json({
      hash: response.data.IpfsHash,
      url: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`,
      name: file.name,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}