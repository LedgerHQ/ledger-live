import { ethers } from "ethers";
import type Transport from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/devices";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, AnyMessage, EIP712Message } from "@ledgerhq/types-live";
import { messageSigner } from "../../../families/evm/setup";
import type { Device } from "../../../hw/actions/types";
import { withDevice } from "../../../hw/deviceAccess";
import { WithdrawSignerMismatchError, WithdrawUnsupportedRouteError } from "./errors";
import { WithdrawPayloadSchema } from "./schemas";
import { getWithdrawTypedData, signWithdrawTypedData } from "./sign";
import { mayanWithdrawPayload, nearWithdrawPayload } from "./__fixtures__/responses";

jest.mock("../../../hw/deviceAccess");
jest.mock("../../../families/evm/setup", () => ({ messageSigner: { signMessage: jest.fn() } }));

const mockedSignMessage = jest.mocked(messageSigner.signMessage);
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
    it("signs the typed data as EIP-712 with the withdrawing account", async () => {
      const signature = await signTypedData(wallet, typedData);
      mockedSignMessage.mockResolvedValueOnce({ signature });

      await expect(signWithdrawTypedData(device, account, typedData)).resolves.toBe(signature);
      expect(withDevice).toHaveBeenCalledWith("device-1", undefined);
      expect(mockedSignMessage).toHaveBeenCalledWith(
        expect.anything(),
        account,
        expect.objectContaining<Partial<AnyMessage>>({ standard: "EIP712", message: typedData }),
      );
    });

    it("reports a rejection on the legacy transport as a refusal", async () => {
      mockedSignMessage.mockRejectedValueOnce(
        Object.assign(new Error("Condition of use not satisfied"), {
          name: "TransportStatusError",
          statusCode: 0x6985,
        }),
      );

      await expect(signWithdrawTypedData(device, account, typedData)).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("rejects a signature that does not recover to the withdrawing account", async () => {
      const otherWallet = new ethers.Wallet(`0x${"22".repeat(32)}`);
      mockedSignMessage.mockResolvedValueOnce({
        signature: await signTypedData(otherWallet, typedData),
      });

      await expect(signWithdrawTypedData(device, account, typedData)).rejects.toThrow(
        WithdrawSignerMismatchError,
      );
    });
  });
});
