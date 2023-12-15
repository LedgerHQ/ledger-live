const originalError = console.error;
const originalWarn = console.warn;

const EXCLUDED_ERRORS = [
  "ViewPropTypes will be removed from React Native, along with all other PropTypes.",
];

const EXCLUDED_WARNINGS = [
  "Using an insecure random number generator",
  "The package 'analytics-react-native' can't access a custom native module",
  "The package 'sovran-react-native' doesn't seem to be linked",
];

console.error = (...args) => {
  const error = args.join();
  if (EXCLUDED_ERRORS.some(excluded => error.includes(excluded))) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  const warning = args.join();
  if (EXCLUDED_WARNINGS.some(excluded => warning.includes(excluded))) {
    return;
  }
  originalWarn.call(console, ...args);
};
