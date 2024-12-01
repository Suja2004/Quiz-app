import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import RoomList from './RoomList';
import Quiz from './Quiz';
import CreateRoom from './CreateRoom';

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Fetch rooms for both user and admin
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms');
        setRooms(response.data.rooms);
      } catch (error) {
        console.error('Error fetching rooms:', error.response?.data || error.message);
      }
    };

    fetchRooms();
  }, []);

  // Fetch questions for a specific room
  const fetchQuestions = async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/questions`);
      setQuestions(response.data.questions);
      setSelectedRoom(roomId);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setIsQuizCompleted(false);
    } catch (error) {
      console.error('Error fetching questions:', error.response?.data || error.message);
    }
  };

  // Handle answer selection
  const handleAnswer = (questionId, answer) => {
    setUserAnswers({ ...userAnswers, [questionId]: answer });
  };

  // Submit the quiz
  const submitQuiz = async () => {
    try {
      await api.post(`/rooms/${selectedRoom}/submit`, { answers: userAnswers });
      setIsQuizCompleted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error.response?.data || error.message);
    }
  };

  // Navigate to the next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Create a new room (for admins)
  const createRoom = async (roomNumber) => {
    try {
      const response = await api.post('/rooms', { roomNumber });
      setRooms([...rooms, response.data.room]);
    } catch (error) {
      console.error('Error creating room:', error.response?.data || error.message);
    }
  };

  return (
    <div>

      <CreateRoom createRoom={createRoom} />

      {selectedRoom ? (
        <Quiz
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          handleAnswer={handleAnswer}
          nextQuestion={nextQuestion}
          submitQuiz={submitQuiz}
          isQuizCompleted={isQuizCompleted}
        />
      ) : (
        <RoomList rooms={rooms} onRoomSelect={fetchQuestions} />
      )}
    </div>
  );
};

export default UserDashboard;
