import add from './example';

describe('adds function', () => {
  test('should add the numbers', () => {
    const result = add(1, 2);
    expect(result).toBe(3);
  });
});
