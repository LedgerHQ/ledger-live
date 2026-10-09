import Hedera from "@ledgerhq/hw-app-hedera";
import type Transport from "@ledgerhq/hw-transport";
import { LegacySignerHedera } from "../src/LegacySignerHedera";

jest.mock("@ledgerhq/hw-app-hedera");

const MockedHedera = Hedera as jest.MockedClass<typeof Hedera>;
const transport = {} as Transport;

describe("LegacySignerHedera", () => {
  let getPublicKey: jest.Mock;
  let signTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getPublicKey = jest.fn().mockResolvedValue("aabbcc");
    signTransaction = jest.fn().mockResolvedValue(Uint8Array.from([9, 9]));
    MockedHedera.mockImplementation(() => ({ getPublicKey, signTransaction }) as unknown as Hedera);
  });

  it("should build hw-app-hedera on the given transport", () => {
    new LegacySignerHedera(transport);

    expect(MockedHedera).toHaveBeenCalledTimes(1);
    expect(MockedHedera).toHaveBeenCalledWith(transport);
  });

  it("should delegate getPublicKey with the path untouched", async () => {
    const result = await new LegacySignerHedera(transport).getPublicKey("44/3030");

    expect(getPublicKey).toHaveBeenCalledTimes(1);
    expect(getPublicKey).toHaveBeenCalledWith("44/3030");
    expect(result).toBe("aabbcc");
  });

  it("should delegate signTransaction with the body untouched", async () => {
    const body = Uint8Array.from([1, 2, 3]);

    const result = await new LegacySignerHedera(transport).signTransaction(body);

    expect(signTransaction).toHaveBeenCalledTimes(1);
    expect(signTransaction).toHaveBeenCalledWith(body);
    expect(result).toEqual(Uint8Array.from([9, 9]));
  });
});
