import { ethers } from "ethers";
import type Transport from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/devices";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { LegacySignerEth } from "@ledgerhq/live-signer-evm";
import type { Account, EIP712Message } from "@ledgerhq/types-live";
import { of, throwError } from "rxjs";
import type { Device } from "../../../hw/actions/types";
import { withDevice } from "../../../hw/deviceAccess";
import { WithdrawSignerMismatchError, WithdrawUnsupportedRouteError } from "./errors";
import { WithdrawPayloadSchema } from "./schemas";
import { getWithdrawTypedData, signWithdrawTypedData } from "./sign";
import { mayanWithdrawPayload, nearWithdrawPayload } from "./__fixtures__/responses";

jest.mock("../../../hw/deviceAccess");
jest.mock("@ledgerhq/live-signer-evm");

const mockSignEIP712Message = jest.fn();
const track = jest.fn();
const analytics = { track, properties: { flow: "perps" } };
const signFailedEvent = ["Perps withdraw signing failed", { flow: "perps" }];
const wallet = new ethers.Wallet(`0x${"11".repeat(32)}`);
const account = { freshAddress: wallet.address, freshAddressPath: "44'/60'/0'/0/0" } as Account;
const device: Device = { deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false };

const signTypedData = (signer: ethers.Wallet, { domain, types, message }: EIP712Message) => {
  const { EIP712Domain: _domainType, ...messageTypes } = types;
  return signer.signTypedData(
    domain as ethers.TypedDataDomain,
    messageTypes,
    message as Record<string, unknown>,
  );
};

describe("withdraw signing", () => {
  const nearPayload = WithdrawPayloadSchema.parse(nearWithdrawPayload);
  const typedData = getWithdrawTypedData(nearPayload);

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(withDevice).mockImplementation(() => job => job({} as Transport));
    jest
      .mocked(LegacySignerEth)
      .mockImplementation(
        () => ({ signEIP712Message: mockSignEIP712Message }) as unknown as LegacySignerEth,
      );
  });

  describe("getWithdrawTypedData", () => {
    it("adds the domain type SwapKit leaves out to the sendAsset typed data", () => {
      const { domain, types, primaryType, message } = nearWithdrawPayload.hyperCoreAction.typedData;

      expect(typedData).toEqual({
        domain,
        primaryType,
        message,
        types: {
          ...types,
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
        },
      });
    });

    it("refuses the Mayan route, which the Ethereum app cannot clear-sign", () => {
      expect(() => getWithdrawTypedData(WithdrawPayloadSchema.parse(mayanWithdrawPayload))).toThrow(
        WithdrawUnsupportedRouteError,
      );
    });
  });

  describe("signWithdrawTypedData", () => {
    const signedBy = async (signer: ethers.Wallet) => {
      const signature = await signTypedData(signer, typedData);
      const { r, s, v } = ethers.Signature.from(signature);
      mockSignEIP712Message.mockReturnValueOnce(
        of(
          { type: "signer.evm.signing" },
          { type: "signer.evm.signed", value: { r: r.slice(2), s: s.slice(2), v } },
        ),
      );
      return signature;
    };

    it("signs the full typed data on the Ethereum app with the withdrawing account", async () => {
      const signature = await signedBy(wallet);

      await expect(signWithdrawTypedData(device, account, typedData, analytics)).resolves.toBe(
        signature,
      );
      expect(withDevice).toHaveBeenCalledWith("device-1", undefined);
      expect(mockSignEIP712Message).toHaveBeenCalledWith(account.freshAddressPath, typedData);
      expect(track).not.toHaveBeenCalled();
    });

    it("never falls back to blind-signing the hashes when full EIP-712 is unsupported", async () => {
      const unsupported = Object.assign(new Error("INS_NOT_SUPPORTED"), {
        statusText: "INS_NOT_SUPPORTED",
      });
      mockSignEIP712Message.mockReturnValueOnce(throwError(() => unsupported));

      await expect(signWithdrawTypedData(device, account, typedData, analytics)).rejects.toBe(
        unsupported,
      );
      expect(track).toHaveBeenCalledWith(...signFailedEvent);
    });

    it("reports a rejection on the legacy transport as a refusal", async () => {
      mockSignEIP712Message.mockReturnValueOnce(
        throwError(() =>
          Object.assign(new Error("Condition of use not satisfied"), {
            name: "TransportStatusError",
            statusCode: 0x6985,
          }),
        ),
      );

      await expect(signWithdrawTypedData(device, account, typedData, analytics)).rejects.toThrow(
        UserRefusedOnDevice,
      );
      expect(track).not.toHaveBeenCalled();
    });

    it("does not report a rejection the DMK signer already mapped as a failure", async () => {
      mockSignEIP712Message.mockReturnValueOnce(throwError(() => new UserRefusedOnDevice()));

      await expect(signWithdrawTypedData(device, account, typedData, analytics)).rejects.toThrow(
        UserRefusedOnDevice,
      );
      expect(track).not.toHaveBeenCalled();
    });

    it("rejects a signature that does not recover to the withdrawing account", async () => {
      await signedBy(new ethers.Wallet(`0x${"22".repeat(32)}`));

      await expect(signWithdrawTypedData(device, account, typedData, analytics)).rejects.toThrow(
        WithdrawSignerMismatchError,
      );
      expect(track).toHaveBeenCalledWith(...signFailedEvent);
    });
  });
});
