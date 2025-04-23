module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    // Handle CSS Modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle static assets (if necessary later)
    // '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    // Use babel-jest to transpile tests with the .js, .jsx extensions
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  // Ignore transforms for node_modules, except for specific modules if needed
  transformIgnorePatterns: [
    '/node_modules/',
    '\\.pnp\\.[^/]+$',
  ],
}; 