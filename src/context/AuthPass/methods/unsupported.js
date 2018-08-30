export default {
  isSupported: () => Promise.resolve(false),
  authenticate: () => Promise.reject(new Error("not supported")),
};
