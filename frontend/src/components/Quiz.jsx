import React from 'react';

const Quiz = ({
  questions,
  currentQuestionIndex,
  userAnswers,
  handleAnswer,
  nextQuestion,
  submitQuiz,
  isQuizCompleted,
}) => {
  if (isQuizCompleted) {
    return (
      <div>
        <h3>Quiz Completed! Thank you for participating.</h3>
      </div>
    );
  }

  return (
    <div>
      {questions.length > 0 ? (
        <div>
          <h3>Question {currentQuestionIndex + 1}/{questions.length}</h3>
          <p>{questions[currentQuestionIndex].text}</p>
          {questions[currentQuestionIndex].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(questions[currentQuestionIndex]._id, option)}
              style={{
                margin: '5px',
                backgroundColor:
                  userAnswers[questions[currentQuestionIndex]._id] === option
                    ? 'lightgreen'
                    : '',
              }}
            >
              {option}
            </button>
          ))}
          <div>
            <button onClick={nextQuestion} disabled={currentQuestionIndex >= questions.length - 1}>
              Next
            </button>
            {currentQuestionIndex === questions.length - 1 && (
              <button onClick={submitQuiz}>Submit Quiz</button>
            )}
          </div>
        </div>
      ) : (
        <p>Loading questions...</p>
      )}
    </div>
  );
};

export default Quiz;
