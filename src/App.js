import './App.css';
import React, { useState, useEffect } from 'react';
import myData from './data.json';

function App() {
  const words = Object.keys(myData);
  const [currentCard, setCurrentCard] = useState(words[0]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCardAnswer, setCurrentCardAnswer] = useState(myData[words[0]]);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const [cardsStudied, setCardsStudied] = useState(0);

  const handleNextCard = () => {
    if (isChangingCard) return; // Prevent rapid clicking
    setIsChangingCard(true);
    setTimeout(() => {
      const rndInt = randomIntFromInterval(0, words.length - 1);
      setCurrentCard(words[rndInt]);
      setCurrentCardAnswer(myData[words[rndInt]]);
      setShowAnswer(false);
      setCardsStudied(prev => prev + 1);
      setIsChangingCard(false);
    }, 300);
  };

  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  useEffect(() => {
    // Initialize with a random card
    const rndInt = randomIntFromInterval(0, words.length - 1);
    setCurrentCard(words[rndInt]);
    setCurrentCardAnswer(myData[words[rndInt]]);
  }, []);

  return (
    <div className="flashcards-container">
      <div className="stats">
        <p>Cards Studied: {cardsStudied}</p>
        <p>Total Cards: {words.length}</p>
      </div>
      <div className="flashcard">
        <div className="card-header">
          <span className="language-tag">{showAnswer ? 'English' : 'Dutch'}</span>
        </div>
        <div className="card-content">
          <h2>{showAnswer ? currentCardAnswer : currentCard}</h2>
        </div>
        <div className="button-container">
          <button onClick={handleToggleAnswer} className="toggle-btn">
            {showAnswer ? 'Show Question' : 'Show Answer'}
          </button>
          <button onClick={handleNextCard} className="next-btn" disabled={isChangingCard}>
            Next Card →
          </button>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min((cardsStudied % words.length) / words.length * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default App;
