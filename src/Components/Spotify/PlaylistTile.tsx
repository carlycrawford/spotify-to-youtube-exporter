import React from 'react';
import '../../App.css'

export interface IPlaylistTileProps {
    name: string;
    imageHref: string;
    length: number;
    selected?: boolean;
    onClick: () => void
}

function PlaylistTile(props: IPlaylistTileProps) {

    const { name, imageHref, length, onClick, selected } = props;

    return (
        <button
            className={`group w-full overflow-hidden rounded-2xl border p-3 text-left transition ${selected
                ? 'border-emerald-300 bg-emerald-400/10'
                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
            }`}
            onClick={() => onClick()}
            type="button"
        >
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-900/70">
                {imageHref ? (
                    <img className="h-full w-full object-cover transition duration-300 group-hover:scale-105" src={imageHref} alt={name} />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🎧</div>
                )}
            </div>

            <div className="mt-3">
                <h5 className="line-clamp-2 headline text-base font-bold text-white">{name}</h5>
                <p className="mt-2 text-sm text-slate-300">{length} songs</p>
            </div>
        </button>
    );
}

export default PlaylistTile;