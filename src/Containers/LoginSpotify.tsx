import React, { useEffect } from 'react';import axios from 'axios';
import * as querystring from 'querystring';
import * as utilscore from 'utils-core.js';

function LoginSpotify(){

    useEffect(() => {

          window.location.replace("https://accounts.spotify.com/authorize?" + querystring.stringify({
            response_type: 'code',
            client_id: "*",
            scope: 'playlist-read-private',
            redirect_uri: "http://localhost:8080/LoginYoutube",
            state: utilscore.generateRandomString({length:16})
          }));
    })

    return (<></>);

}

export default LoginSpotify;