import React from "react";
import { useNavigate } from "react-router-dom";
import LoginSpotifyButton from "../Components/Inputs/LoginSpotifyButton";
import NavBar from "../Components/Nav/NavBar";

function Home() {

    const navigate = useNavigate();

    return (
        <>
            <NavBar />
            <LoginSpotifyButton onClickHandler={() => navigate('/LoginSpotify')} />
        </>
    );
}

export default Home;