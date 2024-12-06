import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const CreateRoom = () => {
  const [roomNumber, setRoomNumber] = useState('');
  const [timeLimit, setTimeLimit] = useState(0); // Timer in minutes
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleCreateRoom = async () => {
    if (!isLoggedIn) {
      setPopupMessage('Please log in to create a room.');
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 3000);
      return;
    }

    if (!roomNumber.trim()) {
      setPopupMessage('Room Number is required.');
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 3000);
      return;
    }

    if (timeLimit <= 0) {
      setPopupMessage('Please set a valid time limit.');
      setIsPopupVisible(true);
      setTimeout(() => {
        setIsPopupVisible(false);
      }, 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.post(
        '/room',
        { roomNumber, timeLimit },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPopupMessage('Room created successfully!');
      setIsPopupVisible(true);
      setRoomNumber('');
      setTimeLimit(0);
      setTimeout(() => {
        setIsPopupVisible(false);
        window.location.reload();
      }, 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to create Room. Please try again.';
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
      <div>
        <h2>Create Room</h2>
        <label htmlFor="roomNumber">Room Code</label>
        <input
          type="text"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="Enter Room Number"
        />
        <label htmlFor="timeLimit">Time Limit</label>
        <input
          type="number"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="Enter Time Limit (in minutes)"
          min="1"
        />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>
      {isPopupVisible && <div className="popup">{popupMessage}</div>}
    </div>
  );
};

export default CreateRoom;
