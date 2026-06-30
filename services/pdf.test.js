/* global jest, describe, it, expect */
const { getPdfPageCount } = require('./pdf');

jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve({
      numpages: 3,
      text: 'Mocked PDF Content',
    });
  });
});

describe('PDF Service', () => {
  it('should get pdf page count correctly', async () => {
    const base64 = 'dGVzdA=='; // 'test' in base64
    const pageCount = await getPdfPageCount(base64);
    expect(pageCount).toBe(3);
  });
});
