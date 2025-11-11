// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress React.act deprecation warning from React Testing Library
// This is a known issue with Create React App + React 18 + RTL v13
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Only suppress the specific ReactDOMTestUtils.act deprecation warning
    if (
      typeof args[0] === 'string' &&
      args[0].includes('`ReactDOMTestUtils.act` is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock Web Speech API for testing
const mockSpeechSynthesis = {
  cancel: jest.fn(),
  speak: jest.fn(),
  getVoices: jest.fn(() => []),
  onvoiceschanged: null,
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  lang: 'ko-KR',
  rate: 0.8,
  pitch: 1.0,
  volume: 1.0,
  voice: null,
}));

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

global.SpeechSynthesisUtterance = mockSpeechSynthesisUtterance;
