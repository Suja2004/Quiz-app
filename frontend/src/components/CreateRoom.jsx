import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const CreateRoom = () => {
  const [roomNumber, setRoomNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleCreateRoom = async (e) => {
    if (!isLoggedIn) {
      setPopupMessage('Please log in to create a room.');
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 3000);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await api.post('/room', { roomNumber }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPopupMessage('Room created successfully!');
      setIsPopupVisible(true);
      setRoomNumber('');
      setTimeout(() => {
        setIsPopupVisible(false);
        window.location.reload();
      }, 3000);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create Room. Please try again.';
      console.error('Error creating Room:', error);
      setPopupMessage(errorMessage);
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
        window.location.reload();
      }, 3000);
    }
  };

  return (
    <div>
      <div className="">
        <h2>Create Room</h2>
        <input
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="Enter Room Number"
        />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>
      {isPopupVisible && (
        <div className="popup">
          {popupMessage}
        </div>
      )}
    </div>
  );
};

export default CreateRoom;
