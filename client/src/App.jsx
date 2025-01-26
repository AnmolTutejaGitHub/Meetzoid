import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinMeeting from './Components/JoinMeeting';
import Meeting from './Components/Meeting';
import { Provider } from './Context/UserContext';
function App() {
  return (
    <div>
      <Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<JoinMeeting />} />
            <Route path="/meeting/:id" element={<Meeting />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </div>
  )
}

export default App;
