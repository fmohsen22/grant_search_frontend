export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_URL || 'http://localhost:5678/webhook-test/7331ee44-831d-459a-8dc1-082e87b9663b',
  CREDENTIALS: {
    username: process.env.NEXT_PUBLIC_API_USERNAME || 'info@noroozclinic.com',
    password: process.env.NEXT_PUBLIC_API_PASSWORD || 'therapy123@NCF',
  }
}; 