export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_URL || 'http://localhost:5678',
  ENDPOINTS: {
    SEARCH_ITEMS: '/extract_search_items',
    SCRAPE_MULTIPLE: '/scrape-multiple',
    ANALYZE_WEBHOOK: 'http://localhost:8000/rank-grants',
    PROPOSAL_WEBHOOK: 'http://localhost:8000/scrape-grant-detail'
  },
  CREDENTIALS: {
    username: process.env.NEXT_PUBLIC_API_USERNAME || 'info@noroozclinic.com',
    password: process.env.NEXT_PUBLIC_API_PASSWORD || 'therapy123@NCF',
  }
}; 