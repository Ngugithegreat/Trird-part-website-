const REDIRECT_URI = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI;
const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID;

export const getOAuthURL = () =>
  `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=en&brand=deriv&redirect_uri=${REDIRECT_URI}`;

export const getDerivWSUrl = () => {
  return `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;
};
