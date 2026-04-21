import axios from 'axios';
import React, { useMemo, useRef, useState } from 'react';

interface SpotifyTrackArtist {
    name: string;
}

interface SpotifyTrackData {
    name: string;
    artists: SpotifyTrackArtist[];
    album?: {
        images?: Array<{ url: string }>;
    };
}

interface SpotifyTrackItem {
    track: SpotifyTrackData | null;
}

interface TracksListProps {
    tracks: SpotifyTrackItem[];
    playlistTitle: string;
    playlistDescription: string;
}

function TracksList(props: TracksListProps) {

    const { tracks, playlistTitle, playlistDescription } = props;
    const [isExporting, setIsExporting] = useState(false);
    const [exportedCount, setExportedCount] = useState(0);
    const [totalToExport, setTotalToExport] = useState(0);
    const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Initialize cache from localStorage on first render
    const initializeCache = () => {
        try {
            const stored = localStorage.getItem('youtube_search_cache');
            return stored ? new Map(JSON.parse(stored)) : new Map();
        } catch {
            return new Map();
        }
    }
    const searchCacheRef = useRef<Map<string, string | null>>(initializeCache());

    const normalizeSearchKey = (track: SpotifyTrackItem): string => {
        const song = track.track?.name.trim().toLowerCase() ?? '';
        const artist = track.track?.artists[0]?.name.trim().toLowerCase() ?? '';
        return `${song}::${artist}`;
    }

    const persistCache = () => {
        try {
            localStorage.setItem('youtube_search_cache', JSON.stringify(Array.from(searchCacheRef.current.entries())));
        } catch (error) {
            console.warn('Failed to persist search cache:', error);
        }
    }

    // Artist-level cache: artist name -> (normalized youtube title -> videoId)
    const initializeArtistCache = (): Map<string, Map<string, string>> => {
        try {
            const stored = localStorage.getItem('youtube_artist_cache');
            if (!stored) return new Map();
            const parsed: [string, [string, string][]][] = JSON.parse(stored);
            return new Map(parsed.map(([artist, songs]) => [artist, new Map(songs)]));
        } catch {
            return new Map();
        }
    }
    const artistCacheRef = useRef<Map<string, Map<string, string>>>(initializeArtistCache());

    const persistArtistCache = () => {
        try {
            const serializable = Array.from(artistCacheRef.current.entries()).map(
                ([artist, songs]) => [artist, Array.from(songs.entries())]
            );
            localStorage.setItem('youtube_artist_cache', JSON.stringify(serializable));
        } catch (error) {
            console.warn('Failed to persist artist cache:', error);
        }
    }

    const getUniqueTracks = (sourceTracks: SpotifyTrackItem[]): SpotifyTrackItem[] => {
        const seen = new Set<string>();
        const unique: SpotifyTrackItem[] = [];

        for (let i = 0; i < sourceTracks.length; i++) {
            if (!sourceTracks[i].track?.name || !sourceTracks[i].track?.artists?.[0]?.name) {
                continue;
            }

            const key = normalizeSearchKey(sourceTracks[i]);
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            unique.push(sourceTracks[i]);
        }

        return unique;
    }

    const uniqueTracks = useMemo(() => getUniqueTracks(tracks), [tracks]);

    const getTracksData = () => {

        const trackList: JSX.Element[] = [];

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i].track;
            if (!track) {
                continue;
            }

            const artistName = track.artists?.[0]?.name ?? 'Unknown artist';
            const image = track.album?.images?.[0]?.url;

            trackList.push(
                <li key={`${track.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900/80">
                        {image ? <img src={image} alt={track.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center">♪</div>}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{i + 1}. {track.name}</p>
                        <p className="truncate text-sm text-slate-300">{artistName}</p>
                    </div>
                </li>
            );
        }

        return trackList;
    }

    const getPlaylistVideoIds = async (playlistId: string, googleToken: string): Promise<Set<string>> => {
        const videoIds = new Set<string>();
        let pageToken: string | undefined;

        try {
            do {
                const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                    params: {
                        part: 'contentDetails',
                        playlistId: playlistId,
                        maxResults: '50',
                        pageToken: pageToken
                    },
                    headers: {
                        Authorization: `Bearer ${googleToken}`
                    }
                });

                const items = response.data.items ?? [];
                items.forEach((item: any) => {
                    const videoId = item.contentDetails?.videoId;
                    if (videoId) {
                        videoIds.add(videoId);
                    }
                });

                pageToken = response.data.nextPageToken;
            } while (pageToken);
        } catch (error) {
            console.warn('Could not fetch existing videos from playlist:', error);
        }

        return videoIds;
    }

    const exportPlaylistHandler = async () => {
        const googleToken = sessionStorage.getItem('google_credential');
        if (!googleToken) {
            console.error('Missing Google credential in session storage.');
            setStatusMessage('Google session expired. Please sign in with Google again.');
            return;
        }

        if (uniqueTracks.length === 0) {
            setStatusMessage('No tracks available to export.');
            return;
        }

        setIsExporting(true);
        setExportedCount(0);
        setTotalToExport(uniqueTracks.length);
        setStatusMessage('Creating YouTube playlist...');

        try {
            const { playlistId, isNewPlaylist } = await findOrCreatePlaylist(googleToken);
            const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
            setYoutubePlaylistUrl(playlistUrl);

            // Only fetch existing videos if playlist already existed (to avoid duplicates)
            let existingVideoIds = new Set<string>();
            if (!isNewPlaylist) {
                setStatusMessage('Fetching existing videos in playlist...');
                existingVideoIds = await getPlaylistVideoIds(playlistId, googleToken);
            }
            
            setStatusMessage('Export in progress...');

            // Pre-compute how many tracks each artist has so we can decide whether
            // a single artist-batch search is worth the quota cost (only if 2+ tracks)
            const artistTrackCount = new Map<string, number>();
            for (const t of uniqueTracks) {
                const key = t.track?.artists[0]?.name.trim().toLowerCase() ?? '';
                if (key) artistTrackCount.set(key, (artistTrackCount.get(key) ?? 0) + 1);
            }

            for (let i = 0; i < uniqueTracks.length; i++) {
                await searchYoutubeForSong(uniqueTracks[i], playlistId, googleToken, existingVideoIds, artistTrackCount);
                setExportedCount(i + 1);
            }

            persistCache();
            setStatusMessage('Export complete. Opening YouTube playlist...');
            window.open(playlistUrl, '_blank');
        } catch (error) {
            setStatusMessage('Export failed. Please try again.');
            console.error('Failed to export playlist to YouTube.', error);
        } finally {
            setIsExporting(false);
        }
    }

    const addVideoToPlaylist = async (videoId: string, playlistId: string, googleToken: string, existingVideoIds: Set<string>) => {
        if (existingVideoIds.has(videoId)) {
            return;
        }
        const payload = {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId: videoId
                }
            }
        };
        try {
            await axios.post('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', payload, {
                headers: {
                    Authorization: `Bearer ${googleToken}`
                }
            });
            existingVideoIds.add(videoId);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                // Video already in playlist — treat as success
                existingVideoIds.add(videoId);
            } else {
                throw error;
            }
        }
    }

    const normalizeYoutubeTitle = (title: string): string => {
        return title
            .toLowerCase()
            .replace(/\(official.*?\)/gi, '')
            .replace(/\[official.*?\]/gi, '')
            .replace(/\(lyrics.*?\)/gi, '')
            .replace(/\[lyrics.*?\]/gi, '')
            .replace(/\(audio.*?\)/gi, '')
            .replace(/\[audio.*?\]/gi, '')
            .replace(/\(music video.*?\)/gi, '')
            .replace(/\(ft\..*?\)/gi, '')
            .replace(/\(feat\..*?\)/gi, '')
            .replace(/\s[-|]\s.*$/, '') // strip "Artist - Song Title" prefix/suffix
            .trim();
    }

    const fetchAndCacheArtistSongs = async (artistKey: string, apiKey: string) => {
        const artistSongs = new Map<string, string>();
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    type: 'video',
                    maxResults: '50',
                    q: artistKey,
                    key: apiKey
                }
            });

            const items: any[] = response.data.items ?? [];
            for (const item of items) {
                const videoId: string | undefined = item.id?.videoId;
                const rawTitle: string = item.snippet?.title ?? '';
                const normalizedTitle = normalizeYoutubeTitle(rawTitle);
                if (videoId && normalizedTitle) {
                    artistSongs.set(normalizedTitle, videoId);
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch songs for artist "${artistKey}":`, error);
        }

        artistCacheRef.current.set(artistKey, artistSongs);
        persistArtistCache();
    }

    const findVideoInArtistCache = (artistKey: string, songKey: string): string | null => {
        const artistSongs = artistCacheRef.current.get(artistKey);
        if (!artistSongs) return null;
        const normalizedSong = songKey.toLowerCase().trim();
        for (const [normalizedTitle, videoId] of artistSongs.entries()) {
            if (normalizedTitle.includes(normalizedSong) || normalizedSong.includes(normalizedTitle)) {
                return videoId;
            }
        }
        return null;
    }

    const searchYoutubeForSong = async (
        track: SpotifyTrackItem,
        playlistId: string,
        googleToken: string,
        existingVideoIds: Set<string>,
        artistTrackCount: Map<string, number>
    ) => {
        if (!track.track) {
            return;
        }

        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
        if (!apiKey) {
            console.error('Missing VITE_GOOGLE_API_KEY');
            return;
        }

        const cacheKey = normalizeSearchKey(track);
        const artistKey = track.track.artists[0]?.name.trim().toLowerCase() ?? '';
        const songKey = track.track.name.trim().toLowerCase();

        // 1. Check per-song cache
        if (searchCacheRef.current.has(cacheKey)) {
            const cachedVideoId = searchCacheRef.current.get(cacheKey);
            if (!cachedVideoId) return;
            await addVideoToPlaylist(cachedVideoId, playlistId, googleToken, existingVideoIds);
            return;
        }

        let videoId: string | null = null;

        // 2. Only do artist batch search if this artist has 2+ tracks in the playlist —
        //    otherwise the batch costs 100 units but helps only one song, same as individual search
        const artistCount = artistTrackCount.get(artistKey) ?? 1;
        if (artistCount >= 2) {
            if (!artistCacheRef.current.has(artistKey)) {
                await fetchAndCacheArtistSongs(artistKey, apiKey);
            }
            videoId = findVideoInArtistCache(artistKey, songKey);
        }

        // 3. Fall back to a targeted individual search if artist batch was skipped or missed
        if (!videoId) {
            const search = `${track.track.name} ${track.track.artists[0].name}`;
            try {
                const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet',
                        type: 'video',
                        maxResults: '1',
                        q: search,
                        key: apiKey
                    }
                });

                const items = response.data.items ?? [];
                videoId = items[0]?.id?.videoId ?? null;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(`Failed to search for "${track.track.name}":`, error.response?.status, error.response?.data);
                } else {
                    console.error(`Failed to search for "${track.track.name}":`, error);
                }
            }
        }

        // Cache the per-song result
        searchCacheRef.current.set(cacheKey, videoId ?? null);
        persistCache();

        if (videoId) {
            await addVideoToPlaylist(videoId, playlistId, googleToken, existingVideoIds);
        }
    }

    const createPlaylist = async (googleToken: string): Promise<string> => {

        const payload = {
            snippet: {
                title: playlistTitle,
                description: playlistDescription
            }
        }
        const response = await axios.post('https://www.googleapis.com/youtube/v3/playlists?part=snippet', payload, {
            headers: {
                Authorization: `Bearer ${googleToken}`
            }
        });

        const responseData = response.data;
        
        return responseData['id'];
    }

    const findOrCreatePlaylist = async (googleToken: string): Promise<{ playlistId: string; isNewPlaylist: boolean }> => {
        try {
            // Search for existing playlists with the same title
            const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlists', {
                params: {
                    part: 'snippet',
                    mine: 'true',
                    maxResults: '50'
                },
                headers: {
                    Authorization: `Bearer ${googleToken}`
                }
            });

            const playlists = searchResponse.data.items ?? [];
            const existingPlaylist = playlists.find((p: any) => p.snippet?.title === playlistTitle);

            if (existingPlaylist) {
                setStatusMessage(`Found existing playlist "${playlistTitle}". Adding tracks...`);
                return { playlistId: existingPlaylist.id, isNewPlaylist: false };
            }
        } catch (error) {
            console.warn('Could not search for existing playlists, creating new one:', error);
        }

        // If no existing playlist found, create a new one
        const playlistId = await createPlaylist(googleToken);
        return { playlistId, isNewPlaylist: true };
    }

    return (
        <section className="glass-card p-4 md:p-6">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="section-title text-white">{playlistTitle}</h3>
                    <p className="mt-1 text-sm text-slate-300">{playlistDescription || 'No description provided.'}</p>
                    <p className="mt-2 text-xs text-slate-400">{tracks.length} songs loaded • {uniqueTracks.length} unique for export</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={async () => await exportPlaylistHandler()}
                        disabled={isExporting}
                        className="primary-btn px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isExporting ? 'Exporting...' : 'Export to YouTube'}
                    </button>
                    {youtubePlaylistUrl && (
                        <a href={youtubePlaylistUrl} target="_blank" rel="noreferrer" className="muted-btn px-4 py-2 text-sm">
                            Open playlist
                        </a>
                    )}
                </div>
            </div>

            {isExporting && (
                <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                    {statusMessage}
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20">
                        <div
                            className="h-full rounded-full bg-emerald-300 transition-all"
                            style={{ width: `${totalToExport > 0 ? (exportedCount / totalToExport) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs">{exportedCount} / {totalToExport}</p>
                </div>
            )}

            {!isExporting && statusMessage && (
                <p className="mt-4 text-sm text-slate-300">{statusMessage}</p>
            )}

            <ul className="mt-5 grid gap-3 md:grid-cols-2">{getTracksData()}</ul>
        </section>
    );

}

export default TracksList;