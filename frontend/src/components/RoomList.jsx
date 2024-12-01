import React from 'react';

const RoomList = ({ rooms, onRoomSelect }) => {
  return (
    <div>
      <h2>Available Rooms</h2>
      <ul>
        {rooms.length === 0 ? (
          <p>No rooms available. Please create a room.</p>
        ) : (
          rooms.map((room) => (
            <li key={room._id}>
              {room.roomNumber}{' '}
              <button onClick={() => onRoomSelect(room._id)}>Attempt Quiz</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RoomList;
