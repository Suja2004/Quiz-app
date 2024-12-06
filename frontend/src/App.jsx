import { Routes, Route } from 'react-router-dom';
import Register from './Auth/Register';
import Login from './Auth/Login';
import Quiz from './components/Quiz';
import QuizRoom from './components/QuizRoom';

const App = () => {

  return (
    <>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<QuizRoom />} />
        <Route path="/quiz/:roomNumber" element={<Quiz />} />
      </Routes>
    </>
  );
};

export default App;
