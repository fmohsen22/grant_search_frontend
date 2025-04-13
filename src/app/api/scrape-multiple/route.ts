import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Proxying request to backend:', body);

    const response = await axios.post('http://127.0.0.1:8000/scrape-multiple', body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('Backend response:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Backend request failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });

    // If we got a response from the server
    if (error.response) {
      return NextResponse.json(
        { 
          error: 'Backend server error',
          details: error.response.data,
          status: error.response.status
        },
        { status: error.response.status }
      );
    }

    // If the request was made but no response was received
    if (error.request) {
      return NextResponse.json(
        { 
          error: 'No response from backend',
          details: 'Could not connect to the backend server. Please ensure it is running.'
        },
        { status: 503 }
      );
    }

    // Something happened in setting up the request
    return NextResponse.json(
      { 
        error: 'Request setup error',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 