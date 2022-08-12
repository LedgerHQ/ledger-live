import "../../__tests__/test-helpers/setup";

import eIP712Message from "@ledgerhq/hw-app-eth/tests/sample-messages/0.json";
import ethSignMessage from "./hw-signMessage";
import { setEnv } from "../../env";
import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712";

const hwSignMessage = ethSignMessage.signMessage;

const signPersonalMessage = jest.fn(() =>
  Promise.resolve({
    r: "r",
    s: "s",
    v: 28,
  })
);
const signEIP712HashedMessage = jest.fn(() =>
  Promise.resolve({
    r: "r",
    s: "s",
    v: 28,
  })
);
const signEIP712Message = jest.fn(() =>
  Promise.resolve({
    r: "r",
    s: "s",
    v: 28,
  })
);
jest.mock("@ledgerhq/hw-app-eth", () => {
  return class {
    signPersonalMessage = signPersonalMessage;
    signEIP712HashedMessage = signEIP712HashedMessage;
    signEIP712Message = signEIP712Message;
  };
});

describe("Eth hw-signMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parsing", () => {
    it("should be using the signPersonalMessage method with string message", async () => {
      await hwSignMessage({} as any, {
        path: "",
        message: "test",
        rawMessage: "0xtest",
      });

      expect(signPersonalMessage).toHaveBeenCalledTimes(1);
    });

    it("should be using the signEIP712HashedMessage method with stringified message", async () => {
      await hwSignMessage({} as any, {
        path: "",
        message: JSON.stringify(eIP712Message),
        rawMessage: "0xtest",
      });

      expect(signEIP712HashedMessage).toHaveBeenCalledTimes(1);
    });

    it("should be using the signEIP712Message method with EIP712Message message", async () => {
      setEnv("EXPERIMENTAL_EIP712", true);

      await hwSignMessage({} as any, {
        path: "",
        message: eIP712Message as EIP712Message,
        rawMessage: "0xtest",
      });

      expect(signEIP712Message).toHaveBeenCalledTimes(1);
      setEnv("EXPERIMENTAL_EIP712", false);
    });

    it("should be using the signEIP712HashedMessage method with EIP712Message message", async () => {
      await hwSignMessage({} as any, {
        path: "",
        message: eIP712Message as EIP712Message,
        rawMessage: "0xtest",
      });

      expect(signEIP712HashedMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("value of v", () => {
    it("should returning parity for signPersonalMessage", async () => {
      const { rsv } = await hwSignMessage({} as any, {
        path: "",
        message: "test",
        rawMessage: "0xtest",
      });

      expect(rsv.v).toBe(1);
    });

    it("should not be returning parity for signEIP712HashedMessage", async () => {
      const { rsv } = await hwSignMessage({} as any, {
        path: "",
        message: JSON.stringify(eIP712Message),
        rawMessage: "0xtest",
      });

      expect(rsv.v).toBe(28);
    });

    it("should not be returning parity for signEIP712Message", async () => {
      setEnv("EXPERIMENTAL_EIP712", true);

      const { rsv } = await hwSignMessage({} as any, {
        path: "",
        message: eIP712Message,
        rawMessage: "0xtest",
      });

      expect(rsv.v).toBe(28);
      setEnv("EXPERIMENTAL_EIP712", false);
    });
  });
});
