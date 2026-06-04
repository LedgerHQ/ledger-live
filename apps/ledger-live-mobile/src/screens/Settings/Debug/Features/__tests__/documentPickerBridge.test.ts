const mockPickerModule = {
  pick: jest.fn(),
  keepLocalCopy: jest.fn(),
  isErrorWithCode: jest.fn(
    (error: unknown) => typeof error === "object" && error !== null && "code" in error,
  ),
  errorCodes: {
    OPERATION_CANCELED: "OPERATION_CANCELED",
  },
};

jest.mock("@react-native-documents/picker", () => mockPickerModule, { virtual: true });

describe("documentPickerBridge", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("loads and caches the document picker module", () => {
    const { getDocumentPicker } = require("../documentPickerBridge");

    const first = getDocumentPicker();
    const second = getDocumentPicker();

    expect(first).toBe(mockPickerModule);
    expect(second).toBe(first);
  });

  it("loads the module from a default export when needed", () => {
    jest.doMock(
      "@react-native-documents/picker",
      () => ({
        __esModule: true,
        default: mockPickerModule,
      }),
      { virtual: true },
    );

    const { getDocumentPicker } = require("../documentPickerBridge");

    expect(getDocumentPicker()).toBe(mockPickerModule);
  });

  it("throws when the native module cannot be loaded", () => {
    jest.doMock("@react-native-documents/picker", () => ({ invalid: true }), { virtual: true });

    const { getDocumentPicker } = require("../documentPickerBridge");

    expect(() => getDocumentPicker()).toThrow(/Document picker module failed to load/i);
  });

  it("throws when the native module is partially loaded", () => {
    jest.doMock(
      "@react-native-documents/picker",
      () => ({
        pick: jest.fn(),
        keepLocalCopy: jest.fn(),
      }),
      { virtual: true },
    );

    const { getDocumentPicker } = require("../documentPickerBridge");

    expect(() => getDocumentPicker()).toThrow(/Document picker module failed to load/i);
  });

  it("detects cancelled picker operations", () => {
    jest.doMock("@react-native-documents/picker", () => mockPickerModule, { virtual: true });

    const { isDocumentPickerCancelled } = require("../documentPickerBridge");

    expect(isDocumentPickerCancelled({ code: "OPERATION_CANCELED" })).toBe(true);
    expect(isDocumentPickerCancelled(new Error("other"))).toBe(false);
  });
});
