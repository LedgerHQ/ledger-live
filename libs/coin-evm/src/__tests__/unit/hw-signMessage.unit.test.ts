import { fail, AssertionError } from "assert";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { prepareMessageToSign, signMessage } from "../../hw-signMessage";
import { makeAccount } from "../fixtures/common.fixtures";

const signPersonalMessage = jest.fn(async () => ({
  r: "01",
  s: "02",
  v: 3,
}));
const signEIP712Message = jest.fn(async () => ({
  r: "03",
  s: "04",
  v: 6,
}));
const signEIP712HashedMessage = jest.fn(async () => ({
  r: "07",
  s: "08",
  v: 9,
}));

const signerContextMock: any = async (deviceId: string, fn: any) => {
  return fn({
    signPersonalMessage,
    signEIP712Message,
    signEIP712HashedMessage,
  });
};

const account = makeAccount(
  "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
  getCryptoCurrencyById("ethereum"),
);

const eip712message = {
  domain: {
    name: "Message Not In CAL",
    version: "1",
    chainId: 1,
    verifyingContract: "0xd007d007a0d06d4fbbf627410eade051fd66fc59",
    salt: "0x446f6f7420446f6f74206c657320746f6361726473206475205661756c740000",
  },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
    ],
    hello: [{ name: "foo", type: "string" }],
  },
  primaryType: "hello",
  message: {
    foo: "bar",
  },
};

describe("EVM Family", () => {
  describe("hw-signMessage.ts", () => {
    describe("prepareMessageToSign", () => {
      it("should parse a random stringified JSON message and still return an EIP191 message", () => {
        expect(
          prepareMessageToSign({ message: JSON.stringify({ randomMessage: "hello" }) }),
        ).toEqual({
          standard: "EIP191",
          message: JSON.stringify({ randomMessage: "hello" }),
        });
      });

      it("should parse a stringified JSON message and still return an EIP712 message", () => {
        expect(prepareMessageToSign({ message: JSON.stringify(eip712message) })).toEqual({
          standard: "EIP712",
          message: eip712message,
          domainHash: "0x471d9cd0511bdacb81977703f269a417092da548042b004ee44f250c077aefd6",
          hashStruct: "0x00ea67203532137e1166447586859962e977f0ce26dc2b53c2f5c9415665a52d",
        });
      });

      it("should return an EIP91 message with a basic string message", () => {
        expect(prepareMessageToSign({ message: "test message" })).toEqual({
          standard: "EIP191",
          message: "test message",
        });
      });
    });

    describe("signMessage", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should sign an EIP191 message", async () => {
        const result = await signMessage(signerContextMock)("", account, {
          standard: "EIP191",
          message: "test message",
        });
        expect(result).toEqual({
          rsv: {
            r: "01",
            s: "02",
            v: 3,
          },
          signature:
            "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000021b",
        });
        expect(signPersonalMessage).toHaveBeenCalled();
      });

      it("should sign an EIP712 message with signEIP712Message", async () => {
        const result = await signMessage(signerContextMock)("", account, {
          standard: "EIP712",
          message: eip712message,
          domainHash: "0x471d9cd0511bdacb81977703f269a417092da548042b004ee44f250c077aefd6",
          hashStruct: "0x00ea67203532137e1166447586859962e977f0ce26dc2b53c2f5c9415665a52d",
        });
        expect(result).toEqual({
          rsv: {
            r: "03",
            s: "04",
            v: 6,
          },
          signature:
            "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000041c",
        });
        expect(signEIP712Message).toHaveBeenCalled();
      });

      it("should sign an EIP712 message and fallback on signEIP712Message when signEIP712Message is not supported", async () => {
        signEIP712Message.mockImplementationOnce(() => {
          const e = new Error();
          (e as any).statusText = "INS_NOT_SUPPORTED";

          throw e;
        });

        const result = await signMessage(signerContextMock)("", account, {
          standard: "EIP712",
          message: eip712message,
          domainHash: "0x471d9cd0511bdacb81977703f269a417092da548042b004ee44f250c077aefd6",
          hashStruct: "0x00ea67203532137e1166447586859962e977f0ce26dc2b53c2f5c9415665a52d",
        });
        expect(result).toEqual({
          rsv: {
            r: "07",
            s: "08",
            v: 9,
          },
          signature:
            "0x000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000081b",
        });
        expect(signEIP712HashedMessage).toHaveBeenCalled();
      });

      it("should throw for any other error", async () => {
        signEIP712Message.mockImplementationOnce(() => {
          throw new Error();
        });

        try {
          await signMessage(signerContextMock)("", account, {
            standard: "EIP712",
            message: eip712message,
            domainHash: "0x471d9cd0511bdacb81977703f269a417092da548042b004ee44f250c077aefd6",
            hashStruct: "0x00ea67203532137e1166447586859962e977f0ce26dc2b53c2f5c9415665a52d",
          });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(Error);
        }
      });

      it("should throw for an unsupported message standard", async () => {
        try {
          await signMessage(signerContextMock)("", account, {
            message: "test",
          });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toEqual("Unsupported message standard");
        }
      });
    });
  });
});
