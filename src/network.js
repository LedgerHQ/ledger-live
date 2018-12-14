// @flow

let networkFn = null;

export const setNetwork = (fn: *) => {
  networkFn = fn;
};

export default (...args: *) => {
  if (!networkFn) {
    throw new Error(
      "live-common: no network function defined. need to call setNetwork()"
    );
  }
  return networkFn(...args);
};
