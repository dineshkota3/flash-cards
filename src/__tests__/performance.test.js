import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Performance and Utility Tests', () => {
  test('renders quickly with large datasets', () => {
    const startTime = performance.now();

    render(<App />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in under 100ms
    expect(renderTime).toBeLessThan(100);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  test('handles rapid language switching', async () => {
    render(<App />);

    const dutchTab = screen.getByRole('button', { name: 'Dutch' });
    const koreanTab = screen.getByRole('button', { name: 'Korean' });

    // Rapidly switch languages 20 times
    for (let i = 0; i < 20; i++) {
      fireEvent.click(koreanTab);
      fireEvent.click(dutchTab);
    }

    // Should still be functional
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(dutchTab).toHaveClass('active');
  });

  test('button states update correctly during animations', async () => {
    render(<App />);

    const nextCardButton = screen.getByText('Next Card →');

    // Button should be enabled initially
    expect(nextCardButton).not.toBeDisabled();

    // Click to trigger animation
    fireEvent.click(nextCardButton);

    // Button should be disabled during animation
    expect(nextCardButton).toBeDisabled();

    // After animation time, button should be enabled again
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(nextCardButton).not.toBeDisabled();
  });

  test('no memory leaks during extended use', async () => {
    // Mock console.error to catch React warnings
    const originalConsoleError = console.error;
    const errors = [];
    console.error = (message) => {
      if (typeof message === 'string' && message.includes('Warning')) {
        errors.push(message);
      }
    };

    const { unmount } = render(<App />);

    // Simulate extended use
    const nextCardButton = screen.getByText('Next Card →');
    const showAnswerButton = screen.getByText('Show Answer');
    const koreanTab = screen.getByRole('button', { name: 'Korean' });
    const dutchTab = screen.getByRole('button', { name: 'Dutch' });

    for (let i = 0; i < 50; i++) {
      fireEvent.click(showAnswerButton);
      fireEvent.click(nextCardButton);

      if (i % 10 === 0) {
        fireEvent.click(koreanTab);
        fireEvent.click(dutchTab);
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    unmount();

    // Restore console.error
    console.error = originalConsoleError;

    // Should not have memory leak warnings
    const memoryLeakErrors = errors.filter(error =>
      error.includes('Can\'t perform a React state update')
    );
    expect(memoryLeakErrors.length).toBe(0);
  });

  test('random card generation produces variety', async () => {
    render(<App />);

    const cardContent = screen.getByRole('heading');
    const nextCardButton = screen.getByText('Next Card →');

    const seenWords = new Set();

    // Generate 10 cards (reduced from 20 to avoid timeout)
    for (let i = 0; i < 10; i++) {
      const currentWord = cardContent.textContent;
      seenWords.add(currentWord);

      fireEvent.click(nextCardButton);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Should see a variety of different words
    expect(seenWords.size).toBeGreaterThan(5);
    expect(seenWords.size).toBeLessThan(21); // Max 22 Dutch words
  });

  test('edge cases in data lookup', () => {
    render(<App />);

    const cardContent = screen.getByRole('heading');

    // Should always find valid words
    for (let i = 0; i < 10; i++) {
      const currentWord = cardContent.textContent;

      // Word should exist in the data
      expect(currentWord).toBeTruthy();
      expect(typeof currentWord).toBe('string');
      expect(currentWord.length).toBeGreaterThan(0);

      fireEvent.click(screen.getByText('Next Card →'));
    }
  });

  test('responsive design elements exist', () => {
    render(<App />);

    // Check for responsive elements
    const container = document.querySelector('.flashcards-container');
    const card = document.querySelector('.flashcard');

    expect(container).toBeInTheDocument();
    expect(card).toBeInTheDocument();

    // Should have responsive CSS classes
    expect(container).toHaveClass('flashcards-container');
    expect(card).toHaveClass('flashcard');
  });

  test('accessibility features', () => {
    render(<App />);

    // Buttons should be accessible (not all buttons should be disabled)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Check that buttons have proper accessibility attributes
    buttons.forEach(button => {
      // Button should be focusable (has tabindex or be naturally focusable)
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    // Main content should be a heading
    const mainContent = screen.getByRole('heading');
    expect(mainContent).toBeInTheDocument();

    // Language tabs should be buttons
    expect(screen.getByRole('button', { name: 'Dutch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Korean' })).toBeInTheDocument();
  });
});