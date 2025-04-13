import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('Proxying grant detail request to backend:', body);

    const response = await axios.post('http://127.0.0.1:8000/scrape-grant-detail', body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout since scraping might take longer
    });

    console.log('Backend response for grant detail:', response.data);
    
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