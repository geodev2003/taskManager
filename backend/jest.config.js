module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeds/**',
    '!src/config/**',
    '!src/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000 // Tăng timeout cho DB operations
};

