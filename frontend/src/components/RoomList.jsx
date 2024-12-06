import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import CreateRoom from './CreateRoom';
import DeleteConfirmation from './DeleteConfirmation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock as faClockRegular } from '@fortawesome/free-regular-svg-icons';
import Quiz from './Quiz';
import { useNavigate } from "react-router-dom";

const RoomList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const currentUserId = localStorage.getItem('userId');
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      setError('Error fetching rooms. Please try again later.');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (roomToDelete) {
      try {
        await api.delete(`/room/${roomToDelete}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRooms(rooms.filter((room) => room._id !== roomToDelete));
        setPopupMessage('Room Deleted Successfully');
        setIsPopupVisible(true);
        setRoomToDelete(null);
        setTimeout(() => {
          setIsPopupVisible(false);
        }, 3000);
      } catch (error) {
        setError('Error deleting room. Please try again later.');
        setPopupMessage('Error deleting room');
        setIsPopupVisible(true);
        setTimeout(() => {
          setIsPopupVisible(false);
        }, 3000);
      }
      setIsModalVisible(false);
    }
  };

  const myRooms = rooms.filter((room) => room.creator === currentUserId);
  const attemptRooms = rooms.filter((room) => room.creator !== currentUserId);

  return (
    <div>
      {loading ? (
        <p className="loading">Loading rooms...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div>
            <CreateRoom />
          </div>
          <h2>Available Rooms</h2>
          <div className="card-list">
            <div className="user-rooms">
              <h3>My Rooms</h3>
              {myRooms.length === 0 ? (
                <p>No rooms created yet. Start by creating your first room!</p>
              ) : (
                myRooms.map((room) => (
                  <div className="card" key={room._id}>
                    <div>{room.roomNumber}</div>
                    <FontAwesomeIcon icon={faClockRegular} />
                    <span>{room.timeLimit ? `${room.timeLimit} mins` : 'No time limit'}</span>
                    <div className="card-actions">
                      <div className="btns">
                        <button
                          className="edit-btn"
                          onClick={() => onSelectRoom(room._id, room.roomNumber)}
                        >
                          Edit
                        </button>
                        <button
                          className="del-btn"
                          onClick={() => {
                            setIsModalVisible(true);
                            setRoomToDelete(room._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="attempt-rooms">
              <h3>Attempt</h3>
              {attemptRooms.length === 0 ? (
                <p>No rooms available to attempt at the moment. Please check back later.</p>
              ) : (
                attemptRooms.map((room) => (
                  <div className="card" key={room._id}>
                    <div>{room.roomNumber}</div>
                    <div className="card-actions">
                      <button onClick={() => navigate(`/quiz/${room._id}`)}>
                        Attempt Quiz
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isPopupVisible && <div className="popup">{popupMessage}</div>}
          </div>
        </>
      )}
      <DeleteConfirmation
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onConfirm={handleDelete}
        msg="room"
      />
    </div>
  );
};

export default RoomList;
