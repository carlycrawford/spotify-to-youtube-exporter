import { GoogleOAuthProvider, OverridableTokenClientConfig, TokenResponse, useGoogleLogin, UseGoogleLoginOptionsAuthCodeFlow, UseGoogleLoginOptionsImplicitFlow } from '@react-oauth/google';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleButton from 'react-google-button';
import NavBar from '../../src/Components/Nav/NavBar';

function LoginYoutube() {

    return (
        <GoogleOAuthProvider clientId="*" children={<LoginButton />} />
    )
}

function LoginButton() {
    const navigate = useNavigate();

    const onSuccessHandler = (token: string) => {
        console.log(token);

        const params = new URL(window.location.href).searchParams;
        const code = params.get("code");
        const state = params.get("state");

        sessionStorage.setItem('spotify_auth', code);
        sessionStorage.setItem('spotify_state', state);

        sessionStorage.setItem('google_credential', token);
        navigate('/CallbackYoutube');
    };

    const login = useGoogleLogin({
        onSuccess: (response) => onSuccessHandler(response.access_token),
        onError: (error) => console.log(error),
        onNonOAuthError: (nonOAuthError) => console.log(nonOAuthError),
        scope: 'https://www.googleapis.com/auth/youtube'
    });

    return (
        <>
            <NavBar />
            <div className="md:flex p-10">
                <div className="w-1/3"></div>
                <div className="w-1/3">

                    <div className="w-full text-center">
                        <p className="text-2xl">Welcome to Spotify to Youtube Exporter!</p>
                        <br/>
                        <p>Thanks for logging in with Spotify, $USER</p>

                        <p>Click the Sign In With Google button below to continue!</p>
                    </div>

                    <div className="md:flex mt-10 justify-center">
                        <GoogleButton onClick={() => login()} />
                    </div>

                </div>
                <div className="w-1/3"></div>
            </div>
        </>
    );
}

export default LoginYoutube;