import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Buffer } from 'buffer';
import PlaylistTile, { IPlaylistTileProps } from '../Components/Spotify/PlaylistTile';
import { Session } from 'inspector/promises';
import TracksList from '../Components/Spotify/TracksList';
import NavBar from '../../src/Components/Nav/NavBar';
function CallbackYoutube() {

    const [accessToken, setAccessToken] = useState('');
    const [playlistData, setPlaylistData] = useState(null);
    
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [tracks, setTracks] = useState(null);

    const [userId, setUserId] = useState(null);

    const getAccessToken = async (code: string, state: string) => {
        const formData = {
            'code': code,
            'redirect_uri': 'http://localhost:8080/LoginYoutube',
            'grant_type': 'authorization_code'
        };

        const auth = Buffer.from('121ea12a1d9b46658296a1c872db6417:385000bec4334617b000cb5a419bb5e6').toString('base64');

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + auth
            }
        };

        const response = await axios.post('https://accounts.spotify.com/api/token', formData, config);

        console.log(response);

        return response;
    }

    useEffect(() => {

        if (sessionStorage.getItem("spotify_access_token")){
            setAccessToken(sessionStorage.getItem("spotify_access_token"));
            return;
        }

        const code = sessionStorage.getItem("spotify_auth");
        const state = sessionStorage.getItem("spotify_state");

        (async () => {

            try {
                const response = await getAccessToken(code, state);

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
                const response = await axios.get(selectedPlaylist.tracks?.href, config);

                if (!!response?.data && response.data['items'] && response.data['items'].length > 0) {
                    setTracks(response.data['items']);
                }
            }
            catch { }
        })();


    }, [selectedPlaylist]);


    const playlistNamesAndLength = () => {
        const playlists = [];

        for (let i = 0; i < playlistData.length; i++) {

            const playlist = playlistData[i];

            const name = playlist['name'];
            const tracks = playlist['tracks'];
            const total = tracks && tracks['total'];

            const images = playlist['images'];
            const image = images && images.length > 0 && images[0];

            const playlistProps: IPlaylistTileProps = {
                name: name,
                length: total,
                imageHref: image && image['url'],
                onClick: () => {
                    setSelectedPlaylist(playlist);
                }
            }

            playlists.push(<><PlaylistTile props={playlistProps} /></>);
        }

        return playlists;
    }

    

    return (
        <>
            <NavBar />
            {
            !selectedPlaylist && 
                (
                <div className="flex flex-wrap justify-center">
                    {playlistData && playlistNamesAndLength()}
                </div>
                )
            }

            {selectedPlaylist && <TracksList tracks={tracks} playlistTitle={selectedPlaylist['name']} playlistDescription={selectedPlaylist['description']} />}
        </>);

}

export default CallbackYoutube;