import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code, codeVerifier } = await req.json();

  if (!code || !codeVerifier) {
    return NextResponse.json({ error: 'Missing code or codeVerifier' }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_DERIV_CLIENT_ID || '';
  const clientSecret = process.env.DERIV_CLIENT_SECRET || '';
  const redirectUri =
    process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ||
    'https://trade.nairobiforextraders.com/callback';

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  try {
    const res = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error_description || data.error || 'Token exchange failed' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Network error during token exchange' }, { status: 500 });
  }
}
