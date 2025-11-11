import './App.css';
import React, { useState, useEffect } from 'react';
import dutchData from './data.json';
import koreanData from './korean-data.json';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('dutch');
  const [currentForeignWord, setCurrentForeignWord] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isChangingCard, setIsChangingCard] = useState(false);
  const [cardsStudied, setCardsStudied] = useState(0);

  const currentData = currentLanguage === 'dutch' ? dutchData : koreanData;
  const words = Object.keys(currentData);

  const handleNextCard = () => {
    if (isChangingCard) return; // Prevent rapid clicking
    setIsChangingCard(true);
    setTimeout(() => {
      const rndInt = randomIntFromInterval(0, words.length - 1);
      const newForeignWord = words[rndInt];
      setCurrentForeignWord(newForeignWord);
      setShowAnswer(false);
      setCardsStudied(prev => prev + 1);
      setIsChangingCard(false);
    }, 300);
  };

  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    setCardsStudied(0);
    setShowAnswer(false);
  };

  function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  useEffect(() => {
    // Initialize with a random card on mount
    if (words.length > 0 && !currentForeignWord) {
      const rndInt = randomIntFromInterval(0, words.length - 1);
      setCurrentForeignWord(words[rndInt]);
    }
  }, []);

  useEffect(() => {
    // Initialize with a random card when language changes
    if (words.length > 0) {
      const rndInt = randomIntFromInterval(0, words.length - 1);
      setCurrentForeignWord(words[rndInt]);
    }
  }, [currentLanguage]);

  return (
    <div className="flashcards-container">
      <div className="language-tabs">
        <button
          className={`tab-btn ${currentLanguage === 'dutch' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('dutch')}
        >
          Dutch
        </button>
        <button
          className={`tab-btn ${currentLanguage === 'korean' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('korean')}
        >
          Korean
        </button>
      </div>
      <div className="stats">
        <p>Cards Studied: {cardsStudied}</p>
        <p>Total Cards: {words.length}</p>
      </div>
      <div className="flashcard">
        <div className="card-header">
          <span className="language-tag">{showAnswer ? 'English' : currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}</span>
        </div>
        <div className="card-content">
          <h2>
            {showAnswer ? currentData[currentForeignWord] : currentForeignWord}
          </h2>
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
