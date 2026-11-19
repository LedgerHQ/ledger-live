import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import * as networkModule from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import type { SuiSigner } from "../types";
import { createBridges } from "./index";

jest.mock("../network", () => ({
  getAccountBalances: jest.fn(),
  getOperations: jest.fn(),
  getDelegatedStakes: jest.fn(),
  createTransaction: jest.fn(),
}));

const FIRST_ACCOUNT = {
  address: "6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
  publicKey: "e5fb8c817b97e9e9aec677b9e822e8a60c7471624f36b701c94560b88195a8e7",
};
const SECOND_ACCOUNT = {
  address: "c9bf8a5402439450fbf5c9a819b69c7e8c164aef2dc7a337929ecfbb7b8f00ff",
  publicKey: "e95d14c7b906d66090556e0fce65ed3b71167b37e0c19136857d35b44f082ba7",
};
const SEED = {
  address: "1b7cf66fe039a16326933b3fe94627a7ddc4d18539b925bdb80f9294f88df4af",
  publicKey: "99807c4b6e1b8b25120f633f5f7816a393e4d3e7f84bdf24bd8afe725911be91",
};

const KEYS_BY_PATH: Record<string, { address: string; publicKey: string }> = {
  "44'/784'/0'/0'/0'": FIRST_ACCOUNT,
  "44'/784'/1'/0'/0'": SECOND_ACCOUNT,
};

const signer = {
  getPublicKey: jest.fn(async (path: string) => {
    const keys = KEYS_BY_PATH[path] ?? SEED;
    return {
      address: Buffer.from(keys.address, "hex"),
      publicKey: Buffer.from(keys.publicKey, "hex"),
    };
  }),
};

const signerContext = ((_deviceId: string, fn: (signer: unknown) => unknown) =>
  fn(signer)) as unknown as SignerContext<SuiSigner>;

const coinConfig = () => ({
  status: { type: "active" as const },
  node: {
    graphqlUrl: "https://graphql.mainnet.sui.io/graphql",
    grpcUrl: "https://fullnode.mainnet.sui.io:443",
  },
  features: { transport: "grpc" as const },
  name: "Sui",
  unit: { name: "Sui", code: "SUI", magnitude: 9 },
});

const mockGetAccountBalances = networkModule.getAccountBalances as jest.Mock;
const mockGetOperations = networkModule.getOperations as jest.Mock;
const mockGetDelegatedStakes = networkModule.getDelegatedStakes as jest.Mock;

describe("currencyBridge.scanAccounts", () => {
  const currency = getCryptoCurrencyById("sui");
  const { currencyBridge } = createBridges(signerContext, coinConfig);

  const scan = async () => {
    const events = await lastValueFrom(
      currencyBridge
        .scanAccounts({
          currency,
          deviceId: "device",
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );
    return events.flatMap(event => (event.type === "discovered" ? [event.account] : []));
  };

  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async () => undefined,
      findTokenById: async () => undefined,
      getTokensSyncHash: async () => "0",
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOperations.mockResolvedValue([]);
    mockGetDelegatedStakes.mockResolvedValue([]);
  });

  it("discovers the funded account then one empty account with the legacy account shape", async () => {
    mockGetAccountBalances.mockImplementation(async (_config: unknown, address: string) => {
      return address === `0x${FIRST_ACCOUNT.address}`
        ? [
            {
              coinType: DEFAULT_COIN_TYPE,
              blockHeight: 10,
              balance: new BigNumber(102_696_240),
              fundsInAddressBalance: new BigNumber(0),
            },
          ]
        : [];
    });

    const accounts = await scan();

    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toMatchObject({
      id: `js:2:sui:0x${FIRST_ACCOUNT.address}:sui`,
      derivationMode: "sui",
      index: 0,
      freshAddress: `0x${FIRST_ACCOUNT.address}`,
      freshAddressPath: "44'/784'/0'/0'/0'",
      seedIdentifier: SEED.publicKey,
      used: true,
      balance: new BigNumber(102_696_240),
    });
    expect(accounts[1]).toMatchObject({
      id: `js:2:sui:0x${SECOND_ACCOUNT.address}:sui`,
      index: 1,
      freshAddressPath: "44'/784'/1'/0'/0'",
      used: false,
      balance: new BigNumber(0),
    });
  });

  it("stops after the first empty account when no later account is used", async () => {
    mockGetAccountBalances.mockResolvedValue([]);

    const accounts = await scan();

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ index: 0, used: false });
  });
});
