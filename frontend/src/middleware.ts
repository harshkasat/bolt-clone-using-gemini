// api/_middleware.js
export default function handler(request, response) {
    // Add COOP/COEP headers
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return response;
  }