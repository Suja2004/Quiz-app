import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const QuizRoom = () => {
  const { user } = useAuth(); // Get user info from context
  const { roomId } = useParams(); // Get room ID from URL
  const history = useHistory();
  const [room, setRoom] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [attemptingQuiz, setAttemptingQuiz] = useState(false);

  useEffect(() => {
    // Fetch room details and quiz questions
    const fetchRoomDetails = async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomId}`);
        setRoom(response.data.room);

        // Check if the logged-in user is the admin or the room creator
        if (response.data.room.createdBy === user.id || user.role === 'admin') {
          setIsAdmin(true);
        }

        // Fetch quiz questions for the room
        const questionsResponse = await axios.get(`/api/rooms/${roomId}/quiz`);
        setQuizQuestions(questionsResponse.data.questions);
      } catch (error) {
        console.error('Error fetching room details:', error);
      }
    };

    fetchRoomDetails();
  }, [roomId, user.id, user.role]);

  const handleQuizAttempt = () => {
    setAttemptingQuiz(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await axios.delete(`/api/rooms/${roomId}/quiz/${questionId}`);
      setQuizQuestions(quizQuestions.filter((q) => q._id !== questionId)); // Update state to remove the deleted question
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await axios.delete(`/api/rooms/${roomId}`);
      history.push('/'); // Redirect to home after room deletion
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const renderQuizQuestions = () => {
    return quizQuestions.map((question) => (
      <div key={question._id} className="quiz-question">
        <p>{question.questionText}</p>
        {isAdmin && (
          <button onClick={() => handleDeleteQuestion(question._id)}>Delete Question</button>
        )}
      </div>
    ));
  };

  return (
    <div className="quiz-room">
      {room ? (
        <div>
          <h2>Quiz Room: {room.roomNumber}</h2>
          <p>Created by: {room.createdBy}</p>
          <p>Room Description: {room.description}</p>

          <div className="quiz-actions">
            {isAdmin && (
              <div>
                <button onClick={handleDeleteRoom}>Delete Room</button>
                {/* Admin can add new questions (for simplicity, not implemented here) */}
              </div>
            )}

            {!attemptingQuiz && (
              <button onClick={handleQuizAttempt}>Start Quiz</button>
            )}

            {attemptingQuiz && (
              <div>
                <h3>Quiz Questions:</h3>
                {renderQuizQuestions()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
};

export default QuizRoom;
