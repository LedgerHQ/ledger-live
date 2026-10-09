import {
  SendCommandInAppDeviceAction,
  UserInteractionRequired,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { GetAppConfigCommand } from "../../src/kit/GetAppConfigCommand";
import { GetPublicKeyCommand } from "../../src/kit/GetPublicKeyCommand";
import { SignerHederaBuilder } from "../../src/kit/SignerHedera";
import { SignTransactionCommand } from "../../src/kit/SignTransactionCommand";

describe("SignerHedera", () => {
  const executeDeviceAction = jest.fn().mockReturnValue({ observable: {}, cancel: jest.fn() });
  const dmk = { executeDeviceAction } as unknown as DeviceManagementKit;
  const signer = new SignerHederaBuilder({ dmk, sessionId: "session-id" }).build();

  const lastAction = () => {
    const [{ sessionId, deviceAction }] = executeDeviceAction.mock.calls.at(-1);
    expect(sessionId).toBe("session-id");
    expect(deviceAction).toBeInstanceOf(SendCommandInAppDeviceAction);
    return deviceAction.input;
  };

  beforeEach(() => {
    executeDeviceAction.mockClear();
  });

  it("should read the app configuration in the Hedera app", () => {
    signer.getAppConfig();

    expect(lastAction()).toEqual({
      command: expect.any(GetAppConfigCommand),
      appName: "Hedera",
      requiredUserInteraction: UserInteractionRequired.None,
      skipOpenApp: false,
    });
  });

  it("should open the app and read the public key silently when no options are given", () => {
    signer.getPublicKey(3);

    const input = lastAction();
    expect(input.command.args).toEqual({ keyIndex: 3, checkOnDevice: false });
    expect(input.requiredUserInteraction).toBe(UserInteractionRequired.None);
    expect(input.skipOpenApp).toBe(false);
  });

  it("should read the public key silently by default", () => {
    signer.getPublicKey(3, { skipOpenApp: true });

    const input = lastAction();
    expect(input.command).toBeInstanceOf(GetPublicKeyCommand);
    expect(input.command.args).toEqual({ keyIndex: 3, checkOnDevice: false });
    expect(input.requiredUserInteraction).toBe(UserInteractionRequired.None);
    expect(input.skipOpenApp).toBe(true);
  });

  it("should expect an address verification when checking on device", () => {
    signer.getPublicKey(0, { checkOnDevice: true });

    const input = lastAction();
    expect(input.command.args).toEqual({ keyIndex: 0, checkOnDevice: true });
    expect(input.requiredUserInteraction).toBe(UserInteractionRequired.VerifyAddress);
  });

  it("should sign the transaction body with the given key index", () => {
    const transactionBody = Uint8Array.from([1, 2, 3]);

    signer.signTransaction(0, transactionBody);

    const input = lastAction();
    expect(input.command).toBeInstanceOf(SignTransactionCommand);
    expect(input.command.args).toEqual({ keyIndex: 0, transactionBody });
    expect(input.requiredUserInteraction).toBe(UserInteractionRequired.SignTransaction);
  });

  it("should refuse a transaction larger than one APDU without reaching the device", () => {
    expect(() => signer.signTransaction(0, new Uint8Array(252))).toThrow(
      "Hedera transaction is 252 bytes, the device accepts at most 251",
    );
    expect(executeDeviceAction).not.toHaveBeenCalled();
  });
});
