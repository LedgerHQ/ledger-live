import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import algosdk from "algosdk";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { algorandDefaults, setCoinConfig } from "../config";
import type { AlgorandSigner } from "../signer";
import type { AlgorandAccount } from "../types";
import { ASA_TOKEN } from "../test/fixtures";
import { buildCurrencyBridge } from "./js";

const FUNDED_ADDRESS = "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q"; // gitleaks:allow
const UNUSED_ADDRESS = algosdk.generateAccount().addr.toString();

const ASA_PREFIX = "algorand/asa/";

const isValidAmount = (amount: BigNumber): boolean =>
  BigNumber.isBigNumber(amount) && !amount.isNaN();

const tokensById = new Map<string, TokenCurrency>();

const buildToken = (id: string): TokenCurrency => {
  const known = tokensById.get(id);
  if (known) return known;

  const token = {
    ...ASA_TOKEN,
    id,
    contractAddress: id.slice(ASA_PREFIX.length),
    name: id,
    ticker: id.slice(ASA_PREFIX.length),
    units: [{ name: id, code: id, magnitude: 0 }],
  } as TokenCurrency;
  tokensById.set(id, token);

  return token;
};

const scan = async (): Promise<AlgorandAccount[]> => {
  const addresses = [FUNDED_ADDRESS, UNUSED_ADDRESS];
  const signer: AlgorandSigner = {
    getAddress: async (path: string) => {
      const index = Number(/^44'\/283'\/(\d+)'/.exec(path)?.[1]);
      const address = addresses[index];
      if (!address) throw new Error(`unexpected derivation path ${path}`);
      return { address, publicKey: `public-key-${index}` };
    },
    sign: async () => ({ signature: null }),
  };
  const signerContext = ((_deviceId: string, fn: (signer: AlgorandSigner) => unknown) =>
    fn(signer)) as unknown as SignerContext<AlgorandSigner>;

  const events = await lastValueFrom(
    buildCurrencyBridge(signerContext)
      .scanAccounts({
        currency: getCryptoCurrencyById("algorand"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as AlgorandAccount);
};

describe("Algorand currency bridge scanAccounts (integration)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      ...algorandDefaults.algorand,
      node: "https://algorand.coin.ledger.com/ps2/v2",
      indexer: "https://algorand.coin.ledger.com/idx2/v2",
    }));
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async () => undefined,
      findTokenById: async id => (id.startsWith(ASA_PREFIX) ? buildToken(id) : undefined),
      getTokensSyncHash: async () => "0",
    });
  });

  it("discovers a used account followed by an unused account", async () => {
    const accounts = await scan();

    expect(accounts.map(account => account.used)).toEqual([true, false]);
  });

  it("derives the id, path and address fields of the discovered accounts", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        id: `js:2:algorand:${FUNDED_ADDRESS}:`,
        index: 0,
        derivationMode: "",
        seedIdentifier: "public-key-0",
        freshAddress: FUNDED_ADDRESS,
        freshAddressPath: "44'/283'/0'/0/0",
        xpub: FUNDED_ADDRESS,
      },
      {
        id: `js:2:algorand:${UNUSED_ADDRESS}:`,
        index: 1,
        derivationMode: "",
        freshAddress: UNUSED_ADDRESS,
        freshAddressPath: "44'/283'/1'/0/0",
      },
    ]);
  });

  it("fills the balances, the resources and the block height of the used account", async () => {
    const [used] = await scan();

    expect({
      balanceIsAmount: isValidAmount(used.balance),
      spendableIsAmount: isValidAmount(used.spendableBalance),
      balanceIsPositive: used.balance.gt(0),
      spendableWithinBalance: used.spendableBalance.lte(used.balance),
      rewardsAreAmount: isValidAmount(used.algorandResources.rewards),
      nbAssetsIsPositive: used.algorandResources.nbAssets > 0,
      blockHeightIsPositive: used.blockHeight > 0,
    }).toEqual({
      balanceIsAmount: true,
      spendableIsAmount: true,
      balanceIsPositive: true,
      spendableWithinBalance: true,
      rewardsAreAmount: true,
      nbAssetsIsPositive: true,
      blockHeightIsPositive: true,
    });
  });

  it("maps every fetched transaction to an operation with typed amounts and addresses", async () => {
    const [used] = await scan();

    const invalidOperations = used.operations.filter(
      op =>
        !isValidAmount(op.value) ||
        !isValidAmount(op.fee) ||
        !op.hash ||
        op.senders.length === 0 ||
        !["IN", "OUT", "FEES", "OPT_IN", "OPT_OUT"].includes(op.type),
    );

    expect({
      hasOperations: used.operationsCount > 0 && used.operationsCount === used.operations.length,
      invalidOperations,
    }).toEqual({ hasOperations: true, invalidOperations: [] });
  });

  it("does not duplicate operations of the used account", async () => {
    const [used] = await scan();

    const ids = used.operations.map(op => op.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds the ASA sub accounts of the opted-in assets of the used account", async () => {
    const [used] = await scan();

    const subAccounts = used.subAccounts ?? [];
    const invalidSubAccounts = subAccounts.filter(
      subAccount =>
        subAccount.type !== "TokenAccount" ||
        subAccount.parentId !== used.id ||
        !isValidAmount(subAccount.balance) ||
        !isValidAmount(subAccount.spendableBalance) ||
        subAccount.operations.some(op => !isValidAmount(op.value) || !isValidAmount(op.fee)),
    );

    expect({ hasSubAccounts: subAccounts.length > 0, invalidSubAccounts }).toEqual({
      hasSubAccounts: true,
      invalidSubAccounts: [],
    });
  });

  it("reports no operation and a zero balance for the unused account", async () => {
    const accounts = await scan();
    const unused = accounts[1];

    expect({
      operationsCount: unused.operationsCount,
      balance: unused.balance.toString(),
      subAccounts: unused.subAccounts,
    }).toEqual({ operationsCount: 0, balance: "0", subAccounts: [] });
  });
});
