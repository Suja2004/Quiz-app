import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import CreateRoom from './CreateRoom';
import DeleteConfirmation from './DeleteConfirmation';

const RoomList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const currentUserId = localStorage.getItem('userId');

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

  return (
    <div>
      {loading ? (
        <p className="loading">Loading rooms...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div>
            {rooms.length === 0 ? (
              <p>No rooms available. Please create a room.</p>
            ) : (
              ''
            )}
            <CreateRoom />
          </div>
          <h2>Available Rooms</h2>
          <div className="card-list">
            <div className="user-rooms">
              <h3>My Rooms</h3>
              {rooms.filter((room) => room.creator === currentUserId).map((room) => (
                <div className="card" key={room._id}>
                  <div>{room.roomNumber}</div>
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
              ))}
            </div>

            <div className="attempt-rooms">
              <h3>Attempt</h3>
              {rooms.filter((room) => room.creator !== currentUserId).map((room) => (
                <div className="card" key={room._id}>
                  <div>{room.roomNumber}</div>
                  <div className="card-actions">
                    <button>
                      Attempt Quiz
                    </button>
                  </div>
                </div>
              ))}
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
