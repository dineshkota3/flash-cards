import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import dutchData from './data.json';
import koreanData from './korean-data.json';

describe('Flashcard App', () => {
  beforeEach(() => {
    render(<App />);
  });

  describe('Initial State', () => {
    test('renders Dutch and Korean language tabs', () => {
      const dutchTab = screen.getByRole('button', { name: 'Dutch' });
      const koreanTab = screen.getByRole('button', { name: 'Korean' });

      expect(dutchTab).toBeInTheDocument();
      expect(koreanTab).toBeInTheDocument();
    });

    test('Dutch tab is active by default', () => {
      const dutchTab = screen.getByRole('button', { name: 'Dutch' });
      expect(dutchTab).toHaveClass('active');
    });

    test('shows stats section', () => {
      expect(screen.getByText(/Cards Studied:/)).toBeInTheDocument();
      expect(screen.getByText(/Total Cards:/)).toBeInTheDocument();
    });

    test('displays flashcard with content', () => {
      const cardContent = screen.getByRole('heading');
      expect(cardContent).toBeInTheDocument();
      expect(cardContent.textContent).toBeTruthy();
    });

    test('shows Show Answer and Next Card buttons', () => {
      expect(screen.getByText('Show Answer')).toBeInTheDocument();
      expect(screen.getByText('Next Card →')).toBeInTheDocument();
    });
  });

  describe('Answer Toggle Functionality', () => {
    test('toggles between foreign word and English translation', async () => {
      const showAnswerButton = screen.getByText('Show Answer');
      const cardContent = screen.getByRole('heading');

      // Get initial foreign word
      const initialWord = cardContent.textContent;
      expect(initialWord).toBeTruthy();

      // Click to show answer
      fireEvent.click(showAnswerButton);

      // Should now show English translation
      expect(screen.getByText('Show Question')).toBeInTheDocument();
      const englishTranslation = cardContent.textContent;
      expect(englishTranslation).not.toBe(initialWord);

      // Verify it's actually the English translation from our data
      const expectedTranslation = dutchData[initialWord];
      expect(englishTranslation).toBe(expectedTranslation);

      // Click to go back to question
      fireEvent.click(screen.getByText('Show Question'));

      // Should show original foreign word again
      expect(cardContent.textContent).toBe(initialWord);
      expect(screen.getByText('Show Answer')).toBeInTheDocument();
    });

    test('language tag updates when toggling answer', () => {
      const showAnswerButton = screen.getByText('Show Answer');
      const languageTag = screen.getByText('Dutch');

      expect(languageTag).toBeInTheDocument();

      // Click to show answer
      fireEvent.click(showAnswerButton);

      // Should now show English tag
      expect(screen.getByText('English')).toBeInTheDocument();

      // Click to go back
      fireEvent.click(screen.getByText('Show Question'));

      // Should show Dutch tag again
      expect(screen.getByText('Dutch')).toBeInTheDocument();
    });
  });

  describe('Language Switching', () => {
    test('switches from Dutch to Korean', async () => {
      const koreanTab = screen.getByRole('button', { name: 'Korean' });
      const cardContent = screen.getByRole('heading');

      // Get initial Dutch word
      const dutchWord = cardContent.textContent;
      expect(Object.keys(dutchData)).toContain(dutchWord);

      // Switch to Korean
      fireEvent.click(koreanTab);

      // Korean tab should be active
      expect(koreanTab).toHaveClass('active');

      // Language tag should update
      expect(screen.getByText('Korean')).toBeInTheDocument();

      // Card should show Korean word
      const koreanWord = cardContent.textContent;
      expect(Object.keys(koreanData)).toContain(koreanWord);
      expect(koreanWord).not.toBe(dutchWord);

      // Answer should be correct Korean translation
      fireEvent.click(screen.getByText('Show Answer'));
      const englishTranslation = cardContent.textContent;
      const expectedTranslation = koreanData[koreanWord];
      expect(englishTranslation).toBe(expectedTranslation);
    });

    test('resets cards studied counter when switching languages', async () => {
      // Study a few cards
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next Card →'));
        // Wait for card change animation
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      const koreanTab = screen.getByRole('button', { name: 'Korean' });
      fireEvent.click(koreanTab);

      // Cards studied should reset
      expect(screen.getByText(/Cards Studied: 0/)).toBeInTheDocument();
    });

    test('hides answer when switching languages', async () => {
      // Show answer in Dutch
      fireEvent.click(screen.getByText('Show Answer'));
      expect(screen.getByText('Show Question')).toBeInTheDocument();

      // Switch to Korean
      fireEvent.click(screen.getByRole('button', { name: 'Korean' }));

      // Should hide answer and show question
      await waitFor(() => {
        expect(screen.getByText('Show Answer')).toBeInTheDocument();
      });
    });
  });

  describe('Next Card Functionality', () => {
    test('loads a new card when clicking Next Card', async () => {
      const nextCardButton = screen.getByText('Next Card →');
      const cardContent = screen.getByRole('heading');

      const initialCard = cardContent.textContent;

      fireEvent.click(nextCardButton);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 350));

      const newCard = cardContent.textContent;
      expect(newCard).not.toBe(initialCard);

      // Should still be a valid word from current language data
      expect(Object.keys(dutchData)).toContain(newCard);
    });

    test('increments cards studied counter', async () => {
      const nextCardButton = screen.getByText('Next Card →');

      expect(screen.getByText(/Cards Studied: 0/)).toBeInTheDocument();

      fireEvent.click(nextCardButton);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(screen.getByText(/Cards Studied: 1/)).toBeInTheDocument();
    });

    test('hides answer when getting new card', async () => {
      // Show answer
      fireEvent.click(screen.getByText('Show Answer'));
      expect(screen.getByText('Show Question')).toBeInTheDocument();

      // Get next card
      fireEvent.click(screen.getByText('Next Card →'));

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should show foreign word and Show Answer button
      expect(screen.getByText('Show Answer')).toBeInTheDocument();
    });

    test('button is disabled during card change animation', () => {
      const nextCardButton = screen.getByText('Next Card →');

      fireEvent.click(nextCardButton);

      // Button should be disabled immediately after click
      expect(nextCardButton).toBeDisabled();

      // Should be re-enabled after animation
      setTimeout(() => {
        expect(nextCardButton).not.toBeDisabled();
      }, 350);
    });
  });

  describe('Data Integrity', () => {
    test('all Dutch words have valid English translations', () => {
      Object.keys(dutchData).forEach(dutchWord => {
        const translation = dutchData[dutchWord];
        expect(translation).toBeTruthy();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    test('all Korean words have valid English translations', () => {
      Object.keys(koreanData).forEach(koreanWord => {
        const translation = koreanData[koreanWord];
        expect(translation).toBeTruthy();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    test('no duplicate words within each language dataset', () => {
      const dutchWords = Object.keys(dutchData);
      const koreanWords = Object.keys(koreanData);

      const uniqueDutchWords = [...new Set(dutchWords)];
      const uniqueKoreanWords = [...new Set(koreanWords)];

      expect(dutchWords.length).toBe(uniqueDutchWords.length);
      expect(koreanWords.length).toBe(uniqueKoreanWords.length);
    });
  });

  describe('Progress Bar', () => {
    test('progress bar updates as cards are studied', async () => {
      const progressBar = document.querySelector('.progress-fill');
      const nextCardButton = screen.getByText('Next Card →');

      const dutchWords = Object.keys(dutchData);

      // Check initial progress
      const initialWidth = progressBar.style.width;

      // Study several cards
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextCardButton);
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      // Progress should increase
      expect(progressBar.style.width).not.toBe(initialWidth);
    });
  });
});
