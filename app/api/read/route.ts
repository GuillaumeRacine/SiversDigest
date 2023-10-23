import { NextRequest, NextResponse } from 'next/server';
import { PineconeClient } from '@pinecone-database/pinecone';
import { queryPineconeVectorStoreAndQueryLLM } from '../../../lib/query';
import { indexName } from '../../../lib/config';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (!body.question) {
    console.log('Status: 400, Error: Missing question in request body');  // Log status and error
    return NextResponse.json({ error: 'Missing question in request body' }, { status: 400 });
  }

  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY || '',
    environment: process.env.PINECONE_ENVIRONMENT || ''
  });

  // Pass both the question and chatHistory (if present) to the function
  const text = await queryPineconeVectorStoreAndQueryLLM(client, indexName, body.question, body.chatHistory || null);

  console.log('Status: 200, Answer:', text);  // Log status and answer

  return NextResponse.json({
    data: text
  });
}

