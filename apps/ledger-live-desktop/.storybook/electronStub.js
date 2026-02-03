const noop = () => undefined;
const asyncNoop = async () => undefined;

module.exports = {
  ipcRenderer: {
    invoke: asyncNoop,
    send: noop,
    on: noop,
    removeListener: noop,
    removeAllListeners: noop,
  },
};
