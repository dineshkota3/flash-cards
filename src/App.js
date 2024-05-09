import './App.css';
import React, { useState } from 'react';
import myData from './data.json';

function App() {

  const words = Object.keys(myData);
  console.log(words);

  const [currentCard, setCurrentCard] = useState(words[0]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCardAnswer, setCurrentCardAnswer] = useState(myData[words[0]]);
  

  const handleNextCard = () => {
    const rndInt = randomIntFromInterval(0, words.length-1);
    console.log(rndInt);
    setCurrentCard(words[rndInt]);
    setCurrentCardAnswer(myData[words[rndInt]]);
    setShowAnswer(false);
  };

  function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  return (
    <div className="flashcards-container">
      <div className="flashcard">
        <div className="card-content">
          <h2>{showAnswer ? currentCardAnswer : currentCard}</h2>
        </div>
        <button onClick={() => setShowAnswer(!showAnswer)}>
          {showAnswer ? 'Show Question' : 'Show Answer'}
        </button>
        <button onClick={handleNextCard}>Next Card</button>
      </div>
    </div>
  );
}

export default App;
