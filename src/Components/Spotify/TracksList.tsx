import axios from 'axios';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function TracksList(props: { tracks, playlistTitle, playlistDescription }) {

    const { state } = useLocation();
    const { tracks, playlistTitle, playlistDescription } = props;

    const tracksHref = state?.tracksHref;

    useEffect(() => {

        if (!tracksHref) {
            return;
        }


    }, []);

    const getTracksData = () => {

        const trackList = [];

        for (var i = 0; i < tracks.length; i++) {
            trackList.push(<li>{i + 1}. {tracks[i].track.name} - {tracks[i].track.artists[0].name}</li>);
        }

        return trackList;
    }

    const exportPlaylistHandler = async () => {
        const playlistId = await createPlaylist();

        for (let i = 0; i < tracks.length; i++) {
            await searchYoutubeForSong(tracks[i], playlistId);
        }
    }

    const searchYoutubeForSong = async (track, playlistId) => {
        const config = {
            headers: {
                'X-Goog-Api-Key': '*'
            }
        };

        const search = `${track.track.name.replace(' ', '%20')} ${track.track.artists[0].name.replace(' ', '%20')}`;

        const queryParams = `part=snippet&q=${search.replace(' ', '%20')}`;

        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search?${queryParams}`, config);

        const responseData = response['data'];

        const songs= responseData['items'];
        
        const song = songs[0];

        if (!!song) {
            const songId = song['id'];
            const videoId = songId['videoId'];

            const payload = {
                snippet: {
                    playlistId: playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: videoId
                    }
                }
            }

            if (!!videoId) {
                const vidResponse = await axios.post(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&access_token=${sessionStorage.getItem('google_credential')}`, payload);

                console.log(vidResponse);
            }
        }
    }

    const createPlaylist = async (): Promise<string> => {

        const payload = {
            snippet: {
                title: playlistTitle,
                description: playlistDescription
            }
        }
        const response = await axios.post(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&access_token=${sessionStorage.getItem('google_credential')}`, payload)

        const responseData = response['data'];
        
        return responseData['id'];
    }

    return (
        <>
            <ul>
                {tracks && getTracksData()}
            </ul>

            <button onClick={async () => await exportPlaylistHandler()}>Export Playlist</button>
        </>
    );

}

export default TracksList;