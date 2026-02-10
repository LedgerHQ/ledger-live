const mockEncode = jest.fn();
const mockDecode = jest.fn();

jest.mock("@icp-sdk/core/candid", () => ({
  IDL: {
    encode: (...args: unknown[]) => mockEncode(...args),
    decode: (...args: unknown[]) => mockDecode(...args),
  },
}));

jest.mock("@icp-sdk/canisters/ledger/icp", () => ({}));
jest.mock("@icp-sdk/core/principal", () => ({}));

jest.mock("./idl/ledger.idl", () => ({
  idlFactory: jest.fn(),
}));

jest.mock("./idl/index.idl", () => ({
  idlFactory: jest.fn(),
}));

import {
  fromNullable,
  getCanisterIdlFunc,
  encodeCanisterIdlFunc,
  decodeCanisterIdlFunc,
} from "./candid";

describe("fromNullable", () => {
  it("should return the value from a Some optional", () => {
    expect(fromNullable([42])).toBe(42);
  });

  it("should return undefined from a None optional", () => {
    expect(fromNullable([])).toBeUndefined();
  });

  it("should return string value from Some", () => {
    expect(fromNullable(["hello"])).toBe("hello");
  });

  it("should return object value from Some", () => {
    const obj = { key: "value" };
    expect(fromNullable([obj])).toBe(obj);
  });

  it("should return undefined for empty array", () => {
    expect(fromNullable([] as [])).toBeUndefined();
  });
});

describe("getCanisterIdlFunc", () => {
  it("should return the function class for a known method", () => {
    const mockFuncClass = { argTypes: [], retTypes: [] };
    const mockIdlFactory = jest.fn().mockReturnValue({
      _fields: [
        ["transfer", mockFuncClass],
        ["balance", { argTypes: [], retTypes: [] }],
      ],
    });

    const result = getCanisterIdlFunc(mockIdlFactory as any, "transfer");
    expect(result).toBe(mockFuncClass);
  });

  it("should throw for an unknown method", () => {
    const mockIdlFactory = jest.fn().mockReturnValue({
      _fields: [["transfer", { argTypes: [], retTypes: [] }]],
    });

    expect(() => getCanisterIdlFunc(mockIdlFactory as any, "nonexistent")).toThrow(
      /Method nonexistent not found/,
    );
  });
});

describe("encodeCanisterIdlFunc", () => {
  beforeEach(() => {
    mockEncode.mockClear();
  });

  it("should encode arguments and return Uint8Array", () => {
    const encodedBuffer = new Uint8Array([1, 2, 3, 4]);
    mockEncode.mockReturnValue(encodedBuffer);

    const mockFunc = { argTypes: ["nat64"] } as any;
    const result = encodeCanisterIdlFunc(mockFunc, [100]);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(mockEncode).toHaveBeenCalledWith(["nat64"], [100]);
  });

  it("should handle ArrayBuffer with byteOffset", () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer, 2, 4);
    view.set([10, 20, 30, 40]);
    mockEncode.mockReturnValue(view);

    const mockFunc = { argTypes: [] } as any;
    const result = encodeCanisterIdlFunc(mockFunc, []);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });
});

describe("decodeCanisterIdlFunc", () => {
  beforeEach(() => {
    mockDecode.mockClear();
  });

  it("should decode a buffer and return the result", () => {
    const decoded = { amount: BigInt(100) };
    mockDecode.mockReturnValue(decoded);

    const mockFunc = { retTypes: ["record"] } as any;
    const buffer = new Uint8Array([1, 2, 3]);
    const result = decodeCanisterIdlFunc(mockFunc, buffer);

    expect(result).toBe(decoded);
    expect(mockDecode).toHaveBeenCalledWith(["record"], buffer);
  });
});
