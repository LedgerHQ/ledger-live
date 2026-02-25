import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { EIP712Message } from "@ledgerhq/types-live";
import { lastValueFrom, of } from "rxjs";
import { DmkSignerEth } from "../src/DmkSignerEth";
import { SignTransactionDAStep } from "@ledgerhq/device-signer-kit-ethereum";

describe("DmkSignerEth", () => {
  const dmkMock = {
    executeDeviceAction: jest.fn(),
    getLoggerFactory: jest.fn().mockReturnValue(() => ({
      tag: jest.fn().mockReturnThis(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  };
  let signer: DmkSignerEth;

  beforeEach(() => {
    jest.clearAllMocks();

    signer = new DmkSignerEth(dmkMock as unknown as DeviceManagementKit, "sessionId");
  });

  describe("getAddress", () => {
    it("should get the address without boolDisplay and boolChainCode", async () => {
      // GIVEN
      const path = "path";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            address: "address",
            publicKey: "publicKey",
            chainCode: undefined,
          },
        }),
      });

      // WHEN
      const result = await signer.getAddress(path);

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              appName: "Ethereum",
              command: expect.objectContaining({
                args: expect.objectContaining({
                  derivationPath: "path",
                  checkOnDevice: false,
                  returnChainCode: false,
                  skipOpenApp: true,
                }),
              }),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: undefined,
      });
    });

    it("should get the address with boolDisplay and boolChainCode", async () => {
      // GIVEN
      const path = "path";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            address: "address",
            publicKey: "publicKey",
            chainCode: "chainCode",
          },
        }),
      });

      // WHEN
      const result = await signer.getAddress(path, true, true);

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              appName: "Ethereum",
              command: expect.objectContaining({
                args: expect.objectContaining({
                  derivationPath: "path",
                  checkOnDevice: true,
                  returnChainCode: true,
                  skipOpenApp: true,
                }),
              }),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        address: "address",
        publicKey: "publicKey",
        chainCode: "chainCode",
      });
    });

    it("should throw the error if the device action is failed", async () => {
      // GIVEN
      const path = "path";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: new Error("error"),
        }),
      });

      // WHEN
      try {
        await signer.getAddress(path);
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error());
      }
    });

    it.each([
      DeviceActionStatus.NotStarted,
      DeviceActionStatus.Pending,
      DeviceActionStatus.Stopped,
    ])(`should throw an error if the device action status is %s`, async status => {
      // GIVEN
      const path = "path";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status,
        }),
      });

      // WHEN
      try {
        await signer.getAddress(path);
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error("Unknown device action status"));
      }
    });
  });

  describe("signPersonalMessage", () => {
    it("should sign the personal message", async () => {
      // GIVEN
      const path = "path";
      const messageHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            r: "0x01",
            s: "0x02",
            v: 0x03,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.signPersonalMessage(path, messageHex));

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              requiredUserInteraction: "sign-personal-message",
              appName: "Ethereum",
              task: expect.any(Function),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: {
          r: "01",
          s: "02",
          v: 3,
        },
      });
    });

    it("should throw an error if the message is invalid", async () => {
      // GIVEN
      const path = "path";
      const messageHex = "invalid";

      // WHEN
      try {
        await lastValueFrom(signer.signPersonalMessage(path, messageHex));
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error("Invalid message"));
      }
    });

    it("should throw the error if the device action is failed", async () => {
      // GIVEN
      const path = "path";
      const messageHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: new Error("error"),
        }),
      });

      // WHEN
      try {
        await lastValueFrom(signer.signPersonalMessage(path, messageHex));
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error());
      }
    });
  });

  describe("signTransaction", () => {
    it("should sign the transaction", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            r: "0x01",
            s: "0x02",
            v: 0x03,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex));

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              derivationPath: "path",
              transaction: Uint8Array.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
              options: expect.objectContaining({
                skipOpenApp: true,
              }),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: {
          r: "01",
          s: "02",
          v: 3,
        },
      });
    });

    it("should sign the transaction with a domain", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      const domain = "vitalik.eth";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            r: "0x01",
            s: "0x02",
            v: 0x03,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex, {
        domains: [
          {
            registry: "ens",
            domain,
            address: "0x",
            type: "forward",
          },
        ]
      }));

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              derivationPath: "path",
              transaction: Uint8Array.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
              options: expect.objectContaining({
                skipOpenApp: true,
              }),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: {
          r: "01",
          s: "02",
          v: 3,
        },
      });
    });

    it("should throw an error if the transaction is invalid", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "invalid";

      // WHEN
      try {
        await signer.signTransaction(path, rawTxHex);
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error("Invalid transaction"));
      }
    });

    it("should emit transaction-checks-opt-in-triggered event", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of(
          {
            status: DeviceActionStatus.Pending,
            intermediateValue: {
              step: "WEB3_CHECKS_OPT_IN",
            },
          },
          {
            status: DeviceActionStatus.Completed,
            output: {
              r: "0x01",
              s: "0x02",
              v: 0x03,
            },
          },
        ),
      });

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex));

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              derivationPath: "path",
              transaction: Uint8Array.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: {
          r: "01",
          s: "02",
          v: 3,
        },
      });
    });

    it("should emit transaction-checks-opt-in event", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            step: SignTransactionDAStep.WEB3_CHECKS_OPT_IN_RESULT,
            result: true,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex));

      // THEN
      expect(result).toEqual({
        type: "signer.evm.transaction-checks-opt-in",
      });
    });

    it("should emit transaction-checks-opt-out event", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Pending,
          intermediateValue: {
            step: SignTransactionDAStep.WEB3_CHECKS_OPT_IN_RESULT,
            result: false,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.signTransaction(path, rawTxHex));

      // THEN
      expect(result).toEqual({
        type: "signer.evm.transaction-checks-opt-out",
      });
    });
  });

  describe("clearSignTransaction", () => {
    it("should sign the transaction", async () => {
      // GIVEN
      const path = "path";
      const rawTxHex = "0x010203040506";
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            r: "0x01",
            s: "0x02",
            v: 0x03,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.clearSignTransaction(path, rawTxHex, {}, false));

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              derivationPath: "path",
              transaction: Uint8Array.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: {
          r: "01",
          s: "02",
          v: 3,
        },
      });
    });
  });

  describe("signEIP712Message", () => {
    it("should sign the EIP712 message", async () => {
      // GIVEN
      const path = "path";
      const message = { message: "message" } as unknown as EIP712Message;
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            r: "0x01",
            s: "0x02",
            v: 0x03,
          },
        }),
      });

      // WHEN
      const result = await lastValueFrom(signer.signEIP712Message(path, message));

      // THEN
      expect(dmkMock.executeDeviceAction).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceAction: expect.objectContaining({
            input: expect.objectContaining({
              derivationPath: "path",
              data: { message: "message" },
            }),
          }),
          sessionId: "sessionId",
        }),
      );
      expect(result).toEqual({
        type: "signer.evm.signed",
        value: {
          r: "01",
          s: "02",
          v: 3,
        },
      });
    });

    it("should throw the error if the device action is failed", async () => {
      // GIVEN
      const path = "path";
      const message = { message: "message" } as unknown as EIP712Message;
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: new Error("error"),
        }),
      });

      // WHEN
      try {
        await lastValueFrom(signer.signEIP712Message(path, message));
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error());
      }
    });
  });

  describe("setLoadConfig", () => {
    it("should do nothing", () => {
      // WHEN
      signer.setLoadConfig({});

      // THEN
      expect(dmkMock.executeDeviceAction).not.toHaveBeenCalled();
    });
  });

  describe("signEIP712HashedMessage", () => {
    it("should throw an error", async () => {
      // GIVEN
      const path = "path";
      const domainSeparatorHex = "domainSeparatorHex";
      const hashStructMessageHex = "hashStructMessageHex";

      // WHEN
      try {
        await lastValueFrom(
          signer.signEIP712HashedMessage(path, domainSeparatorHex, hashStructMessageHex),
        );
        fail("should throw an error");
      } catch (error) {
        // THEN
        expect(error).toEqual(new Error("Method not implemented."));
      }
    });
  });
});
