export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://norooz-backend.fly.dev',
  WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_URL || 'https://norooz-backend.fly.dev',
  ENDPOINTS: {
    SEARCH_ITEMS: '/extract_search_items',
    SCRAPE_MULTIPLE: '/scrape-multiple',
    ANALYZE_WEBHOOK: 'https://norooz-backend.fly.dev/rank-grants',
    PROPOSAL_WEBHOOK: 'https://norooz-backend.fly.dev/scrape-grant-detail'
  },
  CREDENTIALS: {
    username: process.env.NEXT_PUBLIC_API_USERNAME || 'info@noroozclinic.com',
    password: process.env.NEXT_PUBLIC_API_PASSWORD || 'therapy123@NCF',
  }
}; 