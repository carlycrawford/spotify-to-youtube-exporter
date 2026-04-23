import React from "react";
import { useNavigate } from "react-router-dom";
import LoginSpotifyButton from "../Components/Inputs/LoginSpotifyButton";
import NavBar from "../Components/Nav/NavBar";

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

function Home() {

    const navigate = useNavigate();

    const loginWithSpotifyPopup = async () => {
        if (!SPOTIFY_CLIENT_ID) {
            console.error('Missing VITE_SPOTIFY_CLIENT_ID');
            return;
        }

        const state = generateRandomState(16);
        const codeVerifier = generateRandomState(96);
        const codeChallenge = await createCodeChallenge(codeVerifier);

        sessionStorage.setItem('spotify_oauth_state', state);
        sessionStorage.setItem('spotify_pkce_verifier', codeVerifier);

        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }

            const payload = event.data as { type?: string; code?: string; state?: string } | undefined;
            if (!payload || payload.type !== 'spotify-oauth-callback' || !payload.code || !payload.state) {
                return;
            }

            const expectedState = sessionStorage.getItem('spotify_oauth_state');
            if (!expectedState || payload.state !== expectedState) {
                console.error('Spotify popup OAuth state validation failed.');
                window.removeEventListener('message', onMessage);
                return;
            }

            const nextParams = new URLSearchParams({ code: payload.code, state: payload.state });
            window.removeEventListener('message', onMessage);
            navigate(`/LoginYoutube?${nextParams.toString()}`);
        };

        window.addEventListener('message', onMessage);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: 'playlist-read-private',
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });

        const width = 520;
        const height = 720;
        const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
        const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
        const features = `popup=yes,width=${width},height=${height},left=${Math.floor(left)},top=${Math.floor(top)}`;
        const popup = window.open(`https://accounts.spotify.com/authorize?${params.toString()}`, 'spotify_oauth_popup', features);

        if (!popup) {
            window.removeEventListener('message', onMessage);
            console.error('Spotify popup was blocked by the browser.');
        }
    };

    return (
        <>
            <NavBar />
            <LoginSpotifyButton onClickHandler={() => { void loginWithSpotifyPopup(); }} />
        </>
    );
}

export default Home;