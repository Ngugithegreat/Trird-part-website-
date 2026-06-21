import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce';

export async function startDerivLogin(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_DERIV_CLIENT_ID || '';
  const redirectUri =
    process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ||
    'https://trade.nairobiforextraders.com/callback';

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  sessionStorage.setItem('pkce_code_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'trade account_manage',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`https://auth.deriv.com/oauth2/auth?${params.toString()}`);
}

export const SYMBOLS = [
  { id: 'R_10',    label: 'Volatility 10',      short: 'V10',   pip: 3 },
  { id: 'R_25',    label: 'Volatility 25',      short: 'V25',   pip: 3 },
  { id: 'R_50',    label: 'Volatility 50',      short: 'V50',   pip: 2 },
  { id: 'R_75',    label: 'Volatility 75',      short: 'V75',   pip: 2 },
  { id: 'R_100',   label: 'Volatility 100',     short: 'V100',  pip: 2 },
  { id: '1HZ10V',  label: 'Volatility 10 (1s)', short: 'V10s',  pip: 3 },
  { id: '1HZ25V',  label: 'Volatility 25 (1s)', short: 'V25s',  pip: 3 },
  { id: '1HZ50V',  label: 'Volatility 50 (1s)', short: 'V50s',  pip: 2 },
  { id: '1HZ75V',  label: 'Volatility 75 (1s)', short: 'V75s',  pip: 2 },
  { id: '1HZ100V', label: 'Volatility 100 (1s)','short': 'V100s', pip: 2 },
];

export const GRANULARITIES = [
  { value: 60,    label: '1m' },
  { value: 300,   label: '5m' },
  { value: 900,   label: '15m' },
  { value: 1800,  label: '30m' },
  { value: 3600,  label: '1h' },
  { value: 14400, label: '4h' },
  { value: 86400, label: '1D' },
];
