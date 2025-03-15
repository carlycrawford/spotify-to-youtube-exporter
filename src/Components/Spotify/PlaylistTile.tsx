import React from 'react';
import '../../App.css'

export interface IPlaylistTileProps {
    name: string;
    imageHref: string;
    length: number;
    onClick: () => void
}

function PlaylistTile(props: { props: IPlaylistTileProps }) {

    const { name, imageHref, length, onClick } = props.props;

    return (
        <>
            <div className="w-sm h-sm m-5 bg-indigo-500 border-gray-200 dark:bg-indigo-950 rounded-lg shadow-sm" onClick={() => onClick()}>

                <img className="w-sm h-sm rounded-t-lg" src={imageHref} alt="" />

                <div className="p-5">

                    <h5 className="flex text-center items-center mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{name}</h5><br/>
                    <p className="flex text-center items-center px-3 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        Total songs: {length}
                    </p>
                </div>
            </div>


        </>
    );
}

export default PlaylistTile;