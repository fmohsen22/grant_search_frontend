import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    console.log('API Route: Starting request to backend');
    
    // Make a simple fetch request without any special headers
    const response = await fetch('http://127.0.0.1:8000/extract_search_items');
    const data = await response.json();
    
    console.log('API Route: Successfully received data:', data);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API Route: Detailed error information:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch search items',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 