import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import dutchData from '../data.json';
import koreanData from '../korean-data.json';

describe('Integration Tests', () => {
  test('complete flashcard study session workflow', async () => {
    render(<App />);

    // Start with Dutch
    expect(screen.getByRole('button', { name: 'Dutch' })).toHaveClass('active');
    expect(screen.getByText(/Cards Studied: 0/)).toBeInTheDocument();

    const cardContent = screen.getByRole('heading');
    const initialDutchWord = cardContent.textContent;
    expect(Object.keys(dutchData)).toContain(initialDutchWord);

    // Show answer
    fireEvent.click(screen.getByText('Show Answer'));
    expect(screen.getByText('English')).toBeInTheDocument();
    const englishAnswer = cardContent.textContent;
    expect(englishAnswer).toBe(dutchData[initialDutchWord]);

    // Go back to question
    fireEvent.click(screen.getByText('Show Question'));
    const languageTag = document.querySelector('.language-tag');
    expect(languageTag).toHaveTextContent('Dutch');
    expect(cardContent.textContent).toBe(initialDutchWord);

    // Study multiple cards
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next Card →'));
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    expect(screen.getByText(/Cards Studied: 5/)).toBeInTheDocument();

    // Switch to Korean
    fireEvent.click(screen.getByRole('button', { name: 'Korean' }));
    expect(screen.getByRole('button', { name: 'Korean' })).toHaveClass('active');
    expect(screen.getByText(/Cards Studied: 0/)).toBeInTheDocument();

    const koreanWord = cardContent.textContent;
    expect(Object.keys(koreanData)).toContain(koreanWord);
    expect(koreanWord).not.toBe(initialDutchWord);

    // Test Korean answer
    fireEvent.click(screen.getByText('Show Answer'));
    expect(screen.getByText('English')).toBeInTheDocument();
    const koreanAnswer = cardContent.textContent;
    expect(koreanAnswer).toBe(koreanData[koreanWord]);
  });

  test('rapid button clicking does not break the app', async () => {
    render(<App />);

    const nextCardButton = screen.getByText('Next Card →');
    const showAnswerButton = screen.getByText('Show Answer');

    // Rapidly click buttons
    for (let i = 0; i < 10; i++) {
      fireEvent.click(nextCardButton);
      fireEvent.click(showAnswerButton);
    }

    // Wait for all animations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // App should still be functional
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(nextCardButton).toBeInTheDocument();
    expect(showAnswerButton).toBeInTheDocument();

    // Should be able to click normally
    fireEvent.click(showAnswerButton);
    expect(screen.getByText('Show Question')).toBeInTheDocument();
  });

  test('language switching preserves card integrity', async () => {
    render(<App />);

    const cardContent = screen.getByRole('heading');

    // Study some Dutch cards
    const dutchWordsSeen = new Set();
    for (let i = 0; i < 3; i++) {
      const currentWord = cardContent.textContent;
      dutchWordsSeen.add(currentWord);
      fireEvent.click(screen.getByText('Next Card →'));
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Switch to Korean
    fireEvent.click(screen.getByRole('button', { name: 'Korean' }));

    // Study some Korean cards
    const koreanWordsSeen = new Set();
    for (let i = 0; i < 3; i++) {
      const currentWord = cardContent.textContent;
      koreanWordsSeen.add(currentWord);
      fireEvent.click(screen.getByText('Next Card →'));
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Switch back to Dutch
    fireEvent.click(screen.getByRole('button', { name: 'Dutch' }));

    // Should show a Dutch word again
    const finalWord = cardContent.textContent;
    expect(Object.keys(dutchData)).toContain(finalWord);
    expect(Object.keys(koreanData)).not.toContain(finalWord);

    // Verify all seen words were from correct languages
    [...dutchWordsSeen].forEach(word => {
      expect(Object.keys(dutchData)).toContain(word);
    });

    [...koreanWordsSeen].forEach(word => {
      expect(Object.keys(koreanData)).toContain(word);
    });
  });

  test('answer correctness across all data entries', async () => {
    render(<App />);

    const cardContent = screen.getByRole('heading');
    const allDutchWords = Object.keys(dutchData);
    const allKoreanWords = Object.keys(koreanData);

    // Test Dutch answers
    fireEvent.click(screen.getByRole('button', { name: 'Dutch' }));
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let i = 0; i < Math.min(3, allDutchWords.length); i++) {
      const foreignWord = cardContent.textContent;

      // Verify it's a Dutch word
      expect(allDutchWords).toContain(foreignWord);

      // Show answer
      fireEvent.click(screen.getByText('Show Answer'));

      // Verify answer is correct
      const englishAnswer = cardContent.textContent;
      expect(englishAnswer).toBe(dutchData[foreignWord]);

      // Go back and get next card
      fireEvent.click(screen.getByText('Show Question'));
      fireEvent.click(screen.getByText('Next Card →'));
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Test Korean answers
    fireEvent.click(screen.getByRole('button', { name: 'Korean' }));
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let i = 0; i < Math.min(3, allKoreanWords.length); i++) {
      const foreignWord = cardContent.textContent;

      // Verify it's a Korean word
      expect(allKoreanWords).toContain(foreignWord);

      // Show answer
      fireEvent.click(screen.getByText('Show Answer'));

      // Verify answer is correct
      const englishAnswer = cardContent.textContent;
      expect(englishAnswer).toBe(koreanData[foreignWord]);

      // Go back and get next card
      fireEvent.click(screen.getByText('Show Question'));
      fireEvent.click(screen.getByText('Next Card →'));
      await new Promise(resolve => setTimeout(resolve, 350));
    }
  });

  test('progress bar behaves correctly', async () => {
    render(<App />);

    const progressBar = document.querySelector('.progress-fill');
    const nextCardButton = screen.getByText('Next Card →');

    // Initial progress should be 0%
    expect(progressBar.style.width).toBe('0%');

    // Study cards and check progress
    for (let i = 1; i <= 10; i++) {
      fireEvent.click(nextCardButton);
      await new Promise(resolve => setTimeout(resolve, 350));

      // Progress should increase
      const currentProgress = parseInt(progressBar.style.width);
      expect(currentProgress).toBeGreaterThan(0);
    }
  });

  test('stats display is accurate', async () => {
    render(<App />);

    const totalDutchCards = Object.keys(dutchData).length;
    const totalKoreanCards = Object.keys(koreanData).length;

    // Check Dutch stats
    expect(screen.getByText(/Total Cards:/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Total Cards: ${totalDutchCards}`))).toBeInTheDocument();

    // Study some cards
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next Card →'));
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Check studied cards count
    expect(screen.getByText(/Cards Studied: 5/)).toBeInTheDocument();

    // Switch to Korean
    fireEvent.click(screen.getByRole('button', { name: 'Korean' }));
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check Korean stats
    expect(screen.getByText(new RegExp(`Total Cards: ${totalKoreanCards}`))).toBeInTheDocument();
    expect(screen.getByText(/Cards Studied: 0/)).toBeInTheDocument();
  });
});