import React from 'react';

export interface ILoginButtonProps {
    onClickHandler: () => void;
}

function LoginSpotifyButton(props: ILoginButtonProps) {

    const { onClickHandler } = props;

    return (
        <section className="app-shell py-8 md:py-14">
            <div className="glass-card mx-auto max-w-3xl overflow-hidden p-6 md:p-10">
                <div className="step-chip mb-4">Step 1 of 4</div>
                <h1 className="headline text-3xl font-bold text-white md:text-4xl">Move Your Spotify Playlists To YouTube</h1>
                <p className="mt-4 max-w-2xl text-slate-200">
                    Simple guided flow: log in with Spotify, connect Google, choose a playlist, and export.
                    The new YouTube playlist opens automatically in a new tab when export finishes.
                </p>

                <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">1. Connect Spotify</div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">2. Connect Google</div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">3. Pick and export</div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => onClickHandler()}
                        type="button"
                        className="primary-btn w-full gap-3 px-5 py-4 text-lg md:w-auto"
                    >
                        <img className="h-8 w-8" src="./images/Spotify_Primary_Logo_RGB_Green.png" alt="Spotify" />
                        Login with Spotify
                    </button>
                </div>
            </div>
        </section>
    );
}

export default LoginSpotifyButton;