module.exports = {
  env: {
    browser: true,
    jquery: true
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],

    "prettier/prettier": ["error", {
      "tabWidth": 2,
      "singleQuote": true,
      "semi": true
    }]
  }
};
