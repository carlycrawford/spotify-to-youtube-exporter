import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../src/Components/Nav/NavBar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const SPOTIFY_REDIRECT_URI = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined)
    ?? `${window.location.origin}/LoginYoutube`;

function LoginYoutube() {

    if (!GOOGLE_CLIENT_ID) {
        return (
            <>
                <NavBar />
                <section className="app-shell py-10">
                    <div className="glass-card mx-auto max-w-2xl p-8 text-center">
                        <h2 className="headline text-2xl font-bold text-white">Google Login Is Not Configured</h2>
                        <p className="mt-3 text-slate-300">Missing VITE_GOOGLE_CLIENT_ID in your .env file.</p>
                    </div>
                </section>
            </>
        );
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} children={<LoginButton />} />
    )
}

function LoginButton() {
    const navigate = useNavigate();
    const [spotifyUsername, setSpotifyUsername] = useState('Spotify user');

    useEffect(() => {
        if (sessionStorage.getItem('spotify_username')) {
            setSpotifyUsername(sessionStorage.getItem('spotify_username') || 'Spotify user');
            return;
        }

        const params = new URL(window.location.href).searchParams;
        const code = params.get('code');
        const state = params.get('state');
        const expectedState = sessionStorage.getItem('spotify_oauth_state');
        const codeVerifier = sessionStorage.getItem('spotify_pkce_verifier');

        if (!SPOTIFY_CLIENT_ID || !code || !state || !expectedState || state !== expectedState || !codeVerifier) {
            return;
        }

        (async () => {
            try {
                const formData = new URLSearchParams({
                    code,
                    redirect_uri: SPOTIFY_REDIRECT_URI,
                    grant_type: 'authorization_code',
                    client_id: SPOTIFY_CLIENT_ID,
                    code_verifier: codeVerifier
                });

                const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', formData, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                const token = tokenResponse.data?.access_token as string | undefined;
                if (!token) {
                    return;
                }

                sessionStorage.setItem('spotify_access_token', token);

                const meResponse = await axios.get('https://api.spotify.com/v1/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const displayName = (meResponse.data?.display_name as string | undefined)
                    ?? (meResponse.data?.id as string | undefined)
                    ?? 'Spotify user';

                sessionStorage.setItem('spotify_username', displayName);
                setSpotifyUsername(displayName);
            } catch (error) {
                console.error('Failed to fetch Spotify profile.', error);
            }
        })();
    }, []);

    const onSuccessHandler = (token: string) => {
        const params = new URL(window.location.href).searchParams;
        const code = params.get("code");
        const state = params.get("state");
        const expectedState = sessionStorage.getItem('spotify_oauth_state');

        if (!code || !state || !expectedState || state !== expectedState) {
            console.error('Spotify OAuth state validation failed.');
            return;
        }

        sessionStorage.setItem('spotify_auth', code);
        sessionStorage.setItem('spotify_state', state);

        sessionStorage.setItem('google_credential', token);
        navigate('/CallbackYoutube');
    };

    const login = useGoogleLogin({
        onSuccess: (response) => onSuccessHandler(response.access_token),
        onError: (error) => console.log(error),
        onNonOAuthError: (nonOAuthError) => console.log(nonOAuthError),
        scope: 'https://www.googleapis.com/auth/youtube.force-ssl'
    });

    return (
        <>
            <NavBar />
            <section className="app-shell py-8 md:py-12">
                <div className="glass-card mx-auto max-w-3xl p-6 md:p-10">
                    <div className="step-chip">Step 2 of 4</div>
                    <h2 className="headline mt-4 text-3xl font-bold text-white">Connect Your Google Account</h2>
                    <p className="mt-3 text-slate-200">
                        Spotify connected as <span className="font-semibold text-emerald-300">{spotifyUsername}</span>.
                        Sign in with Google so we can create your YouTube playlist.
                    </p>

                    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        <p>Permissions requested:</p>
                        <p className="mt-1">YouTube playlist creation and adding videos to that playlist.</p>
                    </div>

                    <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
                        <button onClick={() => login()} className="primary-btn px-6 py-3 text-base">
                            Continue with Google
                        </button>
                        <p className="text-sm text-slate-400">Next step: choose Spotify playlist and export.</p>
                    </div>
                </div>
            </section>
        </>
    );
}

export default LoginYoutube;