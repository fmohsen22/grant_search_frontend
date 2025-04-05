export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_URL || 'http://localhost:5678',
  ENDPOINTS: {
    SEARCH_ITEMS: '/extract_search_items',
    SCRAPE_MULTIPLE: '/scrape-multiple',
    ANALYZE_WEBHOOK: '/webhook/7331ee44-831d-459a-8dc1-082e87b9663b',
    PROPOSAL_WEBHOOK: '/webhook/7072178c-479a-4245-8c04-6b0e45af976e'
  },
  CREDENTIALS: {
    username: process.env.NEXT_PUBLIC_API_USERNAME || 'info@noroozclinic.com',
    password: process.env.NEXT_PUBLIC_API_PASSWORD || 'therapy123@NCF',
  }
}; 