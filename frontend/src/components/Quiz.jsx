import React, { useState, useEffect } from "react";
import api from '../api/axiosConfig';
import { useParams } from "react-router-dom";

const Quiz = () => {
  const { roomNumber } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    const fetchRoomQuestions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/room/${roomNumber}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const fetchedQuestions = response.data.questions || [];
        setQuestions(fetchedQuestions);
      } catch (err) {
        console.error("Failed to fetch room data:", err);
        setPopupMessage("Failed to load room data.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomQuestions();
  }, [roomNumber]);

  // Handle answer selection
  const handleAnswerChange = (questionIndex, answer) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: answer,
    }));
  };

  // Handle quiz submission and calculate score
  const handleSubmit = () => {
    let calculatedScore = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);

    setPopupMessage(`Quiz completed! Your score: ${calculatedScore}/${questions.length}`);
  };

  const renderQuiz = () => {
    if (questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
      <div className="quiz-container">
        <h2>Quiz:</h2>
        <div>
          <p>{currentQuestionIndex + 1}. {currentQuestion.question}</p>
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className="options"
              onClick={() => handleAnswerChange(currentQuestionIndex, option)}
              style={{
                cursor: "pointer",
                backgroundColor: selectedAnswers[currentQuestionIndex] === option ? "#0077b6" : "#f0f0f0",
                padding: "10px",
                margin: "5px",
                borderRadius: "5px",
              }}
            >
              {option}
            </div>
          ))}
          <div className="buttons">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
                }
              }}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (isLastQuestion) {
                  handleSubmit();
                } else {
                  setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
                }
              }}
              style={{
                backgroundColor: isLastQuestion ? "#ff4d4d" : "#0077b6",
              }}
            >
              {isLastQuestion ? "Submit" : "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div>
      <h2>Quiz Results</h2>
      <p>Your score: {score} / {questions.length}</p>
    </div>
  );

  if (loading) {
    return <div>Loading questions...</div>;
  }

  return (
    <div>
      <div>
        {currentQuestionIndex < questions.length ? renderQuiz() : renderResults()}
      </div>
      {popupMessage && <div className="popup">{popupMessage}</div>}
    </div>
  );
};

export default Quiz;
