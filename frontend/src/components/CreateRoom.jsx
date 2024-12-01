import React, { useState } from 'react';

const CreateRoom = ({ createRoom }) => {
  const [roomNumber, setRoomNumber] = useState('');

  const handleCreateRoom = () => {
    createRoom(roomNumber);
    setRoomNumber('');
  };

  return (
    <div>
      <h2>Create Room</h2>
      <input
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        placeholder="Enter Room Number"
      />
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
};

export default CreateRoom;
