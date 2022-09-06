import "../../__tests__/test-helpers/setup";

import { EIP712Message } from "@ledgerhq/hw-app-eth/lib/modules/EIP712";
import testEIP712Message from "@ledgerhq/hw-app-eth/tests/sample-messages/0.json";
import ethSign from "./hw-signMessage";
import { setEnv } from "../../env";
import { createFixtureCryptoCurrency } from "../../mock/fixtures/cryptoCurrencies";

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
// We only need to mock the defaut class returned
jest.mock("@ledgerhq/hw-app-eth", () => {
  const originalModule = jest.requireActual("@ledgerhq/hw-app-eth");
  return {
    ...originalModule,
    default: class {
      signPersonalMessage = signPersonalMessage;
      signEIP712HashedMessage = signEIP712HashedMessage;
      signEIP712Message = signEIP712Message;
    },
  };
});

describe("prepareMessageToSign", () => {
  it("returns a MessageData object when message to sign is a simple string", () => {
    // Given
    const currency = createFixtureCryptoCurrency("ethereum");
    const path = "44'/60'/0'/0/0";
    const derivationMode = "ethM";
    const message = "4d6573736167652064652074657374";
    const expectedRawMessage = "0x4d6573736167652064652074657374";

    // When
    const result = ethSign.prepareMessageToSign(
      currency,
      path,
      derivationMode,
      message
    );

    // Then
    expect(result).toEqual({
      currency,
      path: "44'/60'/0'/0/0",
      derivationMode: "ethM",
      message: "Message de test",
      rawMessage: expectedRawMessage,
    });
  });

  it("returns a TypedMessageData object when message to sign is an EIP712Message", () => {
    // Given
    const currency = createFixtureCryptoCurrency("ethereum");
    const path = "44'/60'/0'/0/0";
    const derivationMode = "ethM";
    // testEIP712MessageHex
    const message =
      "7b0d0a2020202022646f6d61696e223a207b0d0a202020202020202022636861696e4964223a20352c0d0a2020202020202020226e616d65223a20224574686572204d61696c222c0d0a202020202020202022766572696679696e67436f6e7472616374223a2022307843634343636363634343434363434343434343634363436363436343434363436363636363636343222c0d0a20202020202020202276657273696f6e223a202231220d0a202020207d2c0d0a20202020226d657373616765223a207b0d0a202020202020202022636f6e74656e7473223a202248656c6c6f2c20426f6221222c0d0a20202020202020202266726f6d223a207b0d0a202020202020202020202020226e616d65223a2022436f77222c0d0a2020202020202020202020202277616c6c657473223a205b0d0a2020202020202020202020202020202022307843443261336439463933384531334344393437456330354162433746453733344466384444383236222c0d0a2020202020202020202020202020202022307844656144626565666445416462656566644561646245454664656164626545466445614462656546220d0a2020202020202020202020205d0d0a20202020202020207d2c0d0a202020202020202022746f223a207b0d0a202020202020202020202020226e616d65223a2022426f62222c0d0a2020202020202020202020202277616c6c657473223a205b0d0a2020202020202020202020202020202022307862426242424242626242424262626242626242626262624242624262626262426242626242426242222c0d0a2020202020202020202020202020202022307842304264614265613537423042444142654135376230626441424541353762304244616245613537222c0d0a2020202020202020202020202020202022307842304230623062306230623042303030303030303030303030303030303030303030303030303030220d0a2020202020202020202020205d0d0a20202020202020207d0d0a202020207d2c0d0a20202020227072696d61727954797065223a20224d61696c222c0d0a20202020227479706573223a207b0d0a202020202020202022454950373132446f6d61696e223a205b0d0a2020202020202020202020207b20226e616d65223a20226e616d65222c202274797065223a2022737472696e6722207d2c0d0a2020202020202020202020207b20226e616d65223a202276657273696f6e222c202274797065223a2022737472696e6722207d2c0d0a2020202020202020202020207b20226e616d65223a2022636861696e4964222c202274797065223a202275696e7432353622207d2c0d0a2020202020202020202020207b20226e616d65223a2022766572696679696e67436f6e7472616374222c202274797065223a20226164647265737322207d0d0a20202020202020205d2c0d0a2020202020202020224d61696c223a205b0d0a2020202020202020202020207b20226e616d65223a202266726f6d222c202274797065223a2022506572736f6e22207d2c0d0a2020202020202020202020207b20226e616d65223a2022746f222c202274797065223a2022506572736f6e22207d2c0d0a2020202020202020202020207b20226e616d65223a2022636f6e74656e7473222c202274797065223a2022737472696e6722207d0d0a20202020202020205d2c0d0a202020202020202022506572736f6e223a205b0d0a2020202020202020202020207b20226e616d65223a20226e616d65222c202274797065223a2022737472696e6722207d2c0d0a2020202020202020202020207b20226e616d65223a202277616c6c657473222c202274797065223a2022616464726573735b5d22207d0d0a20202020202020205d0d0a202020207d0d0a7d0d0a";

    // When
    const result = ethSign.prepareMessageToSign(
      currency,
      path,
      derivationMode,
      message
    );

    // Then
    expect(result).toEqual({
      currency,
      path,
      derivationMode,
      message: testEIP712Message,
      rawMessage: "0x" + message,
      hashes: {
        stringHash: "",
        domainHash:
          "0x6137beb405d9ff777172aa879e33edb34a1460e701802746c5ef96e741710e59",
        messageHash:
          "0x5476346eb09179b1f7d245c11a27ae6c498a419d7fad4d984d5b1e0ad081662a",
      },
    });
  });
});

describe("Eth hw-signMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parsing", () => {
    it("should be using the signPersonalMessage method with string message", async () => {
      await ethSign.signMessage({} as any, {
        path: "",
        message: "test",
        rawMessage: "0xtest",
      });

      expect(signPersonalMessage).toHaveBeenCalledTimes(1);
    });

    it("should be using the signEIP712HashedMessage method with stringified message", async () => {
      await ethSign.signMessage({} as any, {
        path: "",
        message: JSON.stringify(testEIP712Message),
        rawMessage: "0xtest",
      });

      expect(signEIP712HashedMessage).toHaveBeenCalledTimes(1);
    });

    it("should be using the signEIP712HashedMessage method with EIP712Message message", async () => {
      await ethSign.signMessage({} as any, {
        path: "",
        message: testEIP712Message as EIP712Message,
        rawMessage: "0xtest",
      });

      expect(signEIP712HashedMessage).toHaveBeenCalledTimes(1);
    });

    describe("when EXPERIMENTAL_EIP712 env variable is set to true", () => {
      beforeAll(() => {
        setEnv("EXPERIMENTAL_EIP712", true);
      });

      afterAll(() => {
        setEnv("EXPERIMENTAL_EIP712", false);
      });

      it("should be using the signEIP712Message method with EIP712Message message", async () => {
        await ethSign.signMessage({} as any, {
          path: "",
          message: testEIP712Message as EIP712Message,
          rawMessage: "0xtest",
        });
      });
    });
  });

  describe("value of v", () => {
    it("should returning parity for signPersonalMessage", async () => {
      const { rsv } = await ethSign.signMessage({} as any, {
        path: "",
        message: "test",
        rawMessage: "0xtest",
      });

      expect(rsv.v).toBe(1);
    });

    it("should not be returning parity for signEIP712HashedMessage", async () => {
      const { rsv } = await ethSign.signMessage({} as any, {
        path: "",
        message: JSON.stringify(testEIP712Message),
        rawMessage: "0xtest",
      });

      expect(rsv.v).toBe(28);
    });

    it("should not be returning parity for signEIP712Message", async () => {
      setEnv("EXPERIMENTAL_EIP712", true);

      const { rsv } = await ethSign.signMessage({} as any, {
        path: "",
        message: testEIP712Message,
        rawMessage: "0xtest",
      });

      expect(rsv.v).toBe(28);
      setEnv("EXPERIMENTAL_EIP712", false);
    });
  });
});
