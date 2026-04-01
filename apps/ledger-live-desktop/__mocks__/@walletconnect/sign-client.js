const mockConnect = jest.fn();
const mockSessionGetAll = jest.fn();
const mockRequest = jest.fn();
const mockPairingGetAll = jest.fn();
const mockPairingDelete = jest.fn();

module.exports = {
  __esModule: true,
  default: {
    init: () =>
      Promise.resolve({
        connect: (...args) => mockConnect(...args),
        session: { getAll: () => mockSessionGetAll() },
        request: (...args) => mockRequest(...args),
        pairing: {
          getAll: () => mockPairingGetAll(),
          delete: (...args) => mockPairingDelete(...args),
        },
      }),
  },
  __mockConnect: mockConnect,
  __mockSessionGetAll: mockSessionGetAll,
  __mockRequest: mockRequest,
  __mockPairingGetAll: mockPairingGetAll,
  __mockPairingDelete: mockPairingDelete,
};
