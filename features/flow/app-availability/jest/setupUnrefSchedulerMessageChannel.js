const { MessageChannel } = require("node:worker_threads");

// The shared flow setup installs Node's MessageChannel. React's scheduler assigns
// port.onmessage, which refs the port and holds the Jest worker after the suite.
function UnrefMessageChannel() {
  const channel = new MessageChannel();

  for (const port of [channel.port1, channel.port2]) {
    const original = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(port), "onmessage");

    Object.defineProperty(port, "onmessage", {
      configurable: true,
      enumerable: true,
      get() {
        return original.get.call(port);
      },
      set(value) {
        original.set.call(port, value);
        port.unref();
      },
    });
  }

  return channel;
}

global.MessageChannel = UnrefMessageChannel;
