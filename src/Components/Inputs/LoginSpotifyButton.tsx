import React from 'react';

export interface ILoginButtonProps {
    onClickHandler: () => void;
}

function LoginSpotifyButton(props: ILoginButtonProps) {

    const { onClickHandler } = props;

    return (
        <div className="md:flex p-10">
            <div className="w-1/3"></div>
            <div className="w-1/3">

                <div className="w-full text-center">
                    <p className="text-2xl">Welcome to Spotify to Youtube Exporter!</p>

                    <p>This is an open source project designed to recreate existing Spotify playlists in Youtube.</p>

                    <p>Click the Login With Spotify button below to get started!</p>
                </div>

                <div className="w-full mt-10">
                    <button onClick={() => onClickHandler()} type="button" className="w-full py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-indigo-500 rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-indigo-950 dark:text-white dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                        <div className="md:flex justify-center">

                            <div className="inline-block p-2"><img className="h-10" src='./images/Spotify_Primary_Logo_RGB_Green.png' /></div>
                            <div className="inline-block text-4xl p-2 text-center">Login With Spotify</div>
                        </div>
                    </button>
                </div>

            </div>
            <div className="w-1/3"></div>
        </div>
    );
}

export default LoginSpotifyButton;