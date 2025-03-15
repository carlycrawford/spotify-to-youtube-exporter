import React, { useEffect } from 'react';
import './styles/style.css';
import axios from 'axios';
import { Route, Routes } from 'react-router-dom';
import LoginSpotify from './Containers/LoginSpotify';
import Home from './Containers/Home';
import CallbackSpotify from './Containers/CallbackYoutube';
import LoginYoutube from './Containers/LoginYoutube';
import CallbackYoutube from './Containers/CallbackYoutube';

function App() {

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/LoginSpotify' element={<LoginSpotify />} />
      <Route path='/LoginYoutube' element={<LoginYoutube />} />
      <Route path='/CallbackYoutube' element={<CallbackYoutube />} />
    </Routes>
  );
}

export default App;
