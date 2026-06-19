export const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '36544';
export const DERIV_OAUTH_URL = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&l=en&brand=deriv`;

export const getDerivWSUrl = () => {
  return `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;
};