import React from 'react';
import { NavLink } from 'react-router-dom';

function NavBar() {

    const navClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-lg text-sm font-semibold transition ${isActive
            ? 'bg-white/15 text-white'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`;

    return (
        <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/75 backdrop-blur-md">
            <div className="app-shell flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-xl">🎵</div>
                    <div>
                        <p className="headline text-lg font-bold text-white">Spotify to YouTube Exporter</p>
                        <p className="text-xs text-slate-300">Move playlists in four quick steps</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <NavLink to="/" className={navClass}>Home</NavLink>
                    <NavLink to="/LoginSpotify" className={navClass}>1. Spotify</NavLink>
                    <NavLink to="/LoginYoutube" className={navClass}>2. Google</NavLink>
                    <NavLink to="/CallbackYoutube" className={navClass}>3. Export</NavLink>
                </div>
            </div>
        </nav>
    );

}

export default NavBar;