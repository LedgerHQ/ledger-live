export const action = (name = "action") => (...args) => {
  if (typeof console !== "undefined") {
    console.log(`[storybook action] ${name}`, ...args);
  }
};

export const actions = (names = []) =>
  names.reduce((result, name) => {
    result[name] = action(name);
    return result;
  }, {});

export default { action, actions };
