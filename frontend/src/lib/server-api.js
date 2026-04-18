export function getServerApiUrl() {
  return process.env.INTERNAL_BACKEND_URL || 'http://localhost:8001';
}
