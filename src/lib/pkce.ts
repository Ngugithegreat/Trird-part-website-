export function generateCodeVerifier(): string {
  const array = crypto.getRandomValues(new Uint8Array(64));
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(array)
    .map((v) => charset[v % charset.length])
    .join('');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateState(): string {
  const array = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
