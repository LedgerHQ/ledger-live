jest.mock("../logic", () => ({
  parseExtendedPublicKey: jest.fn(),
  scanAddresses: jest.fn(),
  scanOperations: jest.fn(),
}));
jest.mock("../network", () => ({
  getBlockDagInfo: jest.fn(),
  getVirtualChainBlueScore: jest.fn(),
}));

import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { parseExtendedPublicKey, scanAddresses, scanOperations } from "../logic";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../network";
import type { KaspaSigner } from "../types";
import { createBridges } from "./index";

const mockedParseExtendedPublicKey = jest.mocked(parseExtendedPublicKey);
const mockedScanAddresses = jest.mocked(scanAddresses);
const mockedScanOperations = jest.mocked(scanOperations);
const mockedGetBlockDagInfo = jest.mocked(getBlockDagInfo);
const mockedGetVirtualChainBlueScore = jest.mocked(getVirtualChainBlueScore);

const xpub = "02".repeat(65);
const signer = {
  getAddress: jest.fn(async (path: string) => ({
    address: "kaspa:address",
    publicKey: xpub,
    path,
  })),
};
const signerContext = ((_deviceId: string, fn: (signer: typeof signer) => unknown) =>
  fn(signer)) as SignerContext<KaspaSigner>;

describe("currencyBridge.scanAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedParseExtendedPublicKey.mockReturnValue({
      compressedPublicKey: Buffer.from("key"),
      chainCode: Buffer.from("chain"),
    });
    mockedScanAddresses.mockResolvedValue({
      usedReceiveAddresses: [],
      usedChangeAddresses: [],
      nextReceiveAddress: {
        address: "kaspa:receive",
        type: 0,
        index: 0,
        balance: new BigNumber(0),
        active: false,
        timestamp: null,
      },
      nextChangeAddress: {
        address: "kaspa:change",
        type: 1,
        index: 0,
        balance: new BigNumber(0),
        active: false,
        timestamp: null,
      },
      totalBalance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    });
    mockedScanOperations.mockResolvedValue([]);
    mockedGetBlockDagInfo.mockResolvedValue({ pastMedianTime: "1" } as Awaited<
      ReturnType<typeof getBlockDagInfo>
    >);
    mockedGetVirtualChainBlueScore.mockResolvedValue(1);
  });

  it("should discover the first empty account using the address returned by the device", async () => {
    const { currencyBridge } = createBridges(signerContext);
    const result = await firstValueFrom(
      currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("kaspa"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      }),
    );

    expect(result).toMatchObject({
      type: "discovered",
      account: { xpub, index: 0, freshAddress: "kaspa:receive", used: false },
    });
    expect(signer.getAddress).toHaveBeenCalledWith("44'/111111'/0'", false);
  });
});
