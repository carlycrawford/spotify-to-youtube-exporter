import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PlaylistTile, { IPlaylistTileProps } from '../Components/Spotify/PlaylistTile';
import TracksList from '../Components/Spotify/TracksList';
import NavBar from '../../src/Components/Nav/NavBar';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
const SPOTIFY_REDIRECT_URI = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined)
    ?? `${window.location.origin}/LoginYoutube`;

interface SpotifyImage {
    url: string;
}

interface SpotifyPlaylistTracks {
    href?: string;
    total?: number;
}

interface SpotifyPlaylist {
    name: string;
    description?: string;
    tracks?: SpotifyPlaylistTracks;
    images?: SpotifyImage[];
}

interface SpotifyTrackArtist {
    name: string;
}

interface SpotifyTrackData {
    name: string;
    artists: SpotifyTrackArtist[];
}

interface SpotifyTrackItem {
    track: SpotifyTrackData;
}

function CallbackYoutube() {

    const [accessToken, setAccessToken] = useState('');
    const [playlistData, setPlaylistData] = useState<SpotifyPlaylist[] | null>(null);
    const [spotifyUsername, setSpotifyUsername] = useState('Spotify user');
    
    const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
    const [tracks, setTracks] = useState<SpotifyTrackItem[] | null>(null);

    const [userId, setUserId] = useState<string | null>(null);

    const getAccessToken = async (code: string, codeVerifier: string) => {
        if (!SPOTIFY_CLIENT_ID) {
            throw new Error('Missing VITE_SPOTIFY_CLIENT_ID');
        }

        const formData = new URLSearchParams({
            code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            grant_type: 'authorization_code',
            client_id: SPOTIFY_CLIENT_ID,
            code_verifier: codeVerifier
        });

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const response = await axios.post('https://accounts.spotify.com/api/token', formData, config);

        return response;
    }

    useEffect(() => {

        const existingToken = sessionStorage.getItem("spotify_access_token");
        const savedName = sessionStorage.getItem('spotify_username');
        if (savedName) {
            setSpotifyUsername(savedName);
        }

        if (existingToken){
            setAccessToken(existingToken);
            return;
        }

        const code = sessionStorage.getItem("spotify_auth");
        const state = sessionStorage.getItem("spotify_state");
        const expectedState = sessionStorage.getItem('spotify_oauth_state');
        const codeVerifier = sessionStorage.getItem('spotify_pkce_verifier');

        if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
            console.error('Spotify authorization context is missing or invalid.');
            return;
        }

        (async () => {

            try {
                const response = await getAccessToken(code, codeVerifier);

                if (!!response?.data && response.data['access_token'] && response.data['access_token'].length > 0) {
                    setAccessToken(response.data['access_token']);
                    sessionStorage.setItem("spotify_access_token", response.data['access_token']);
                }
            }
            catch { }
        })();


    }, []);

    useEffect(() => {

        if (!accessToken || accessToken.length === 0) {
            return;
        }

        const config = {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        };

        (async () => {

            try {
                const response = await axios.get('https://api.spotify.com/v1/me', config);

                if (!!response?.data && response.data['id'] && response.data['id'].length > 0) {
                    setUserId(response.data['id']);
                }
            }
            catch { }
        })();


    }, [accessToken]);

    useEffect(() => {
        if (!accessToken || accessToken.length === 0) {
            return;
        }

        const config = {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        };

        (async () => {

            try {
                const response = await axios.get('https://api.spotify.com/v1/me/playlists', config);

                if (!!response?.data && response.data['items'] && response.data['items'].length > 0) {
                    setPlaylistData(response.data['items']);
                }
            }
            catch { }
        })();


    }, [userId]);

    useEffect(() => {

        const tracksHref = selectedPlaylist?.tracks?.href;

        if (!tracksHref || !accessToken || accessToken.length === 0) {
            return;
        }

        const config = {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        };

        (async () => {

            try {
                const response = await axios.get(tracksHref, config);

                if (!!response?.data && response.data['items'] && response.data['items'].length > 0) {
                    setTracks(response.data['items']);
                }
            }
            catch { }
        })();


    }, [selectedPlaylist]);


    const playlistNamesAndLength = () => {
        if (!playlistData) {
            return [];
        }

        const playlists: JSX.Element[] = [];

        for (let i = 0; i < playlistData.length; i++) {

            const playlist = playlistData[i];

            const name = playlist['name'];
            const tracks = playlist['tracks'];
            const total = tracks?.total ?? 0;

            const images = playlist['images'];
            const image = images?.[0];

            const playlistProps: IPlaylistTileProps = {
                name: name,
                length: total,
                imageHref: image?.url ?? '',
                selected: selectedPlaylist?.name === playlist.name,
                onClick: () => {
                    setSelectedPlaylist(playlist);
                }
            }

            playlists.push(<PlaylistTile key={`${name}-${i}`} {...playlistProps} />);
        }

        return playlists;
    }

    

    return (
        <>
            <NavBar />
            <section className="app-shell py-8 md:py-10">
                <div className="mb-6 flex flex-col gap-2">
                    <div className="step-chip">Step 3 of 4</div>
                    <h2 className="headline text-3xl font-bold text-white">Choose Playlist And Export</h2>
                    <p className="text-slate-300">Signed in as <span className="font-semibold text-emerald-300">{spotifyUsername}</span>. Pick a Spotify playlist to convert.</p>
                </div>

                {!selectedPlaylist && (
                    <>
                        {!playlistData && (
                            <div className="glass-card p-6 text-slate-300">Loading your Spotify playlists...</div>
                        )}

                        {playlistData && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {playlistNamesAndLength()}
                            </div>
                        )}
                    </>
                )}

                {selectedPlaylist && (
                    <div className="space-y-4">
                        <button
                            className="muted-btn px-4 py-2 text-sm"
                            onClick={() => setSelectedPlaylist(null)}
                            type="button"
                        >
                            Back to playlists
                        </button>
                        <TracksList tracks={tracks ?? []} playlistTitle={selectedPlaylist.name} playlistDescription={selectedPlaylist.description ?? ''} />
                    </div>
                )}
            </section>
        </>);

}

export default CallbackYoutube;