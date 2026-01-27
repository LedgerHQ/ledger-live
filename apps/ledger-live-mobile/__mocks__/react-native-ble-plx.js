module.exports = {
  BleError: class BleError extends Error {
    constructor(message) {
      super(message);
      this.reason = message;
    }
  },
  State: {
    Unknown: "Unknown",
    Resetting: "Resetting",
    Unsupported: "Unsupported",
    Unauthorized: "Unauthorized",
    PoweredOff: "PoweredOff",
    PoweredOn: "PoweredOn",
  },
  BleManager: jest.fn().mockImplementation(() => ({
    onStateChange: jest.fn((callback, emitCurrentState) => {
      if (emitCurrentState) {
        callback("PoweredOn");
      }
      return { remove: jest.fn() };
    }),
    state: jest.fn().mockResolvedValue("PoweredOn"),
    stopDeviceScan: jest.fn(),
    startDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    cancelDeviceConnection: jest.fn(),
    isDeviceConnected: jest.fn().mockResolvedValue(false),
    destroy: jest.fn(),
  })),
};
