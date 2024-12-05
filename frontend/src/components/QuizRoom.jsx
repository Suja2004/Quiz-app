import React, { useEffect, useState } from "react";
import api from '../api/axiosConfig';
import RoomList from "./RoomList";
import DeleteConfirmation from './DeleteConfirmation';

const QuizRoom = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [RoomNumber, setRoomNumber] = useState('');
  const [form, setForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRoom) {
      const fetchRoomQuestions = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await api.get(`/room/${selectedRoom}/questions`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const fetchedQuestions = response.data.questions || [];
          setQuestions(fetchedQuestions);
        } catch (err) {
          console.error("Failed to fetch room data:", err);
          showPopup("Failed to load room data.");
        } finally {
          setLoading(false);
        }
      };

      fetchRoomQuestions();
    }
  }, [selectedRoom]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/room/${selectedRoom}/question`, { ...form }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newQuestion = response.data.question;
      setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
      showPopup("Question added successfully");
      setForm({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
      });
    } catch (err) {
      showPopup(err.response?.data?.error || "Failed to add question");
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;
    const token = localStorage.getItem('token');

    try {
      await api.delete(`/question/${questionToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuestions(questions.filter((q) => q._id !== questionToDelete));
      showPopup("Question Deleted Successfully");
    } catch (err) {
      console.error("Error deleting question:", err);
      showPopup("Error deleting question. Please try again later.");
    } finally {
      setIsModalVisible(false);
    }
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setIsPopupVisible(true);
    setTimeout(() => setIsPopupVisible(false), 3000);
  };
  const handleSelectRoom = (roomId, roomNumber) => {
    setSelectedRoom(roomId);
    setRoomNumber(roomNumber);
  };

  if (!selectedRoom) {
    return <RoomList onSelectRoom={handleSelectRoom} />;
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="room">
      <>
        <div className="add-question-container">
          <h3>Add a Question to Room : <ins>{RoomNumber}</ins></h3>
          <input
            className="add-question-input"
            type="text"
            placeholder="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            required
          />
          {form.options.map((option, index) => (
            <input
              key={index}
              className="add-question-option"
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) =>
                setForm({
                  ...form,
                  options: form.options.map((opt, i) =>
                    i === index ? e.target.value : opt
                  ),
                })
              }
            />
          ))}
          <input
            className="add-question-input correct"
            type="text"
            placeholder="Correct Answer"
            value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
          />
          <button className="add-question-button" onClick={handleSubmit}>
            Add Question
          </button>
        </div>
        <div className="question-list">
          {Array.isArray(questions) && questions.length > 0 ? (
            questions.map((question) => (
              <div className="questions" key={question._id}>
                <p><strong>Question:</strong> {question.question}</p>
                <ul>
                  {question.options.map((option, index) => (
                    <li key={index}>{option}</li>
                  ))}
                </ul>
                <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                <button
                  className="del-btn"
                  onClick={() => {
                    setIsModalVisible(true);
                    setQuestionToDelete(question._id);
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p>No questions available.</p>
          )}
        </div>
        {isPopupVisible && <div className="popup">{popupMessage}</div>}
      </>
      <DeleteConfirmation
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onConfirm={handleDelete}
        msg="question"
      />
    </div>
  );
};

export default QuizRoom;
