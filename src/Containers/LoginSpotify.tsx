import React, { useEffect, useState } from 'react';
import NavBar from '../Components/Nav/NavBar';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const SPOTIFY_REDIRECT_URI = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined)
  ?? `${window.location.origin}/LoginYoutube`;

function generateRandomState(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  return base64UrlEncode(new Uint8Array(digest));
}

function LoginSpotify(){
    const [message, setMessage] = useState('Redirecting to Spotify...');

    useEffect(() => {
          if (!SPOTIFY_CLIENT_ID) {
            console.error('Missing VITE_SPOTIFY_CLIENT_ID');
            setMessage('Missing VITE_SPOTIFY_CLIENT_ID. Add it to your .env file and try again.');
            return;
          }

          const state = generateRandomState(16);
          const codeVerifier = generateRandomState(96);

          sessionStorage.setItem('spotify_oauth_state', state);
          sessionStorage.setItem('spotify_pkce_verifier', codeVerifier);

          (async () => {
            const codeChallenge = await createCodeChallenge(codeVerifier);

            const params = new URLSearchParams({
              response_type: 'code',
              client_id: SPOTIFY_CLIENT_ID,
              scope: 'playlist-read-private',
              redirect_uri: SPOTIFY_REDIRECT_URI,
              state,
              code_challenge_method: 'S256',
              code_challenge: codeChallenge
            });

            window.location.replace(`https://accounts.spotify.com/authorize?${params.toString()}`);
          })();
    }, [])

    return (
      <>
        <NavBar />
        <section className="app-shell py-10">
          <div className="glass-card mx-auto max-w-2xl p-8 text-center">
            <div className="step-chip mb-4">Step 1 of 4</div>
            <h2 className="headline text-2xl font-bold text-white">Connect Spotify</h2>
            <p className="mt-3 text-slate-200">{message}</p>
            <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
            </div>
          </div>
        </section>
      </>
    );

}

export default LoginSpotify;