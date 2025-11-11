import dutchData from '../data.json';
import koreanData from '../korean-data.json';

describe('Data Validation Tests', () => {
  describe('Dutch Data', () => {
    test('contains expected number of words', () => {
      const words = Object.keys(dutchData);
      expect(words.length).toBeGreaterThan(0);
      expect(words.length).toBe(22); // Current count in data.json
    });

    test('all words are strings', () => {
      Object.keys(dutchData).forEach(word => {
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      });
    });

    test('all translations are strings', () => {
      Object.values(dutchData).forEach(translation => {
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    test('contains specific expected Dutch words', () => {
      const expectedWords = ['appel', 'morgen', 'klein', 'huis', 'water'];
      const actualWords = Object.keys(dutchData);

      expectedWords.forEach(word => {
        expect(actualWords).toContain(word);
      });
    });

    test('translations make sense for key words', () => {
      expect(dutchData['appel']).toBe('apple');
      expect(dutchData['morgen']).toBe('tomorrow');
      expect(dutchData['klein']).toBe('small');
      expect(dutchData['huis']).toBe('house');
    });
  });

  describe('Korean Data', () => {
    test('contains expected number of words', () => {
      const words = Object.keys(koreanData);
      expect(words.length).toBeGreaterThan(0);
      expect(words.length).toBe(28); // Current count in korean-data.json
    });

    test('all words are strings', () => {
      Object.keys(koreanData).forEach(word => {
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      });
    });

    test('all translations are strings', () => {
      Object.values(koreanData).forEach(translation => {
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    test('contains specific expected Korean words', () => {
      const expectedWords = ['안녕하세요', '감사합니다', '사랑해', '집', '물'];
      const actualWords = Object.keys(koreanData);

      expectedWords.forEach(word => {
        expect(actualWords).toContain(word);
      });
    });

    test('translations make sense for key words', () => {
      expect(koreanData['안녕하세요']).toBe('hello');
      expect(koreanData['감사합니다']).toBe('thank you');
      expect(koreanData['사랑해']).toBe('I love you');
      expect(koreanData['집']).toBe('house');
    });
  });

  describe('Cross-Language Data Consistency', () => {
    test('no overlapping words between datasets', () => {
      const dutchWords = Object.keys(dutchData);
      const koreanWords = Object.keys(koreanData);

      dutchWords.forEach(word => {
        expect(koreanWords).not.toContain(word);
      });
    });

    test('both datasets have some common English translations', () => {
      const dutchTranslations = Object.values(dutchData);
      const koreanTranslations = Object.values(koreanData);

      // Find common translations
      const commonTranslations = dutchTranslations.filter(translation =>
        koreanTranslations.includes(translation)
      );

      // Should have at least some common words like 'house', 'water', etc.
      expect(commonTranslations.length).toBeGreaterThan(5);
      expect(commonTranslations).toContain('house');
      expect(commonTranslations).toContain('water');
      expect(commonTranslations).toContain('dog');
      expect(commonTranslations).toContain('cat');
    });

    test('all translations are lowercase English', () => {
      [...Object.values(dutchData), ...Object.values(koreanData)].forEach(translation => {
        expect(translation).toBe(translation.toLowerCase());
        expect(/^[a-z\s]+$/.test(translation)).toBe(true);
      });
    });
  });
});