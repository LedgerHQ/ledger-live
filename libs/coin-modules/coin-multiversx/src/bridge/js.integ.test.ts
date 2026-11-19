import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import type { MultiversXSigner } from "../signer";
import type { MultiversXAccount } from "../types";
import { MEX_TOKEN } from "../test/fixtures";
import { buildCurrencyBridge } from "./js";

const FUNDED_ADDRESS = "erd1vgfp3g7azqjx4wsmtt7067m0l62v3psmqzr24j6xvywj2tlz0gesvyzsq2";
const NEXT_ADDRESS = "erd1pm3gje2lmd5vyldcvuy6jpxgde4rapjpujvujkee6a7jw2zmh4tqre796z";
const TOKEN_HOLDER_ADDRESS = "erd1rnq7m8kdrpyfany4fweqtydsk4pgx0l6dtl6tvcad5wesagruxts62e9rk"; // gitleaks:allow

const scanWith = async (addresses: string[]): Promise<MultiversXAccount[]> => {
  const signer: MultiversXSigner = {
    getAddress: async (path: string) => {
      const index = Number(/^44'\/508'\/(\d+)'/.exec(path)?.[1]);
      const address = addresses[index];
      if (!address) throw new Error(`unexpected derivation path ${path}`);
      return { address, publicKey: `public-key-${index}` };
    },
    setAddress: async () => undefined,
    sign: async () => ({ signature: null }),
    provideESDTInfo: async () => undefined,
  };
  const signerContext = ((_deviceId: string, fn: (signer: MultiversXSigner) => unknown) =>
    fn(signer)) as unknown as SignerContext<MultiversXSigner>;

  const events = await lastValueFrom(
    buildCurrencyBridge(signerContext)
      .scanAccounts({
        currency: getCryptoCurrencyById("elrond"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as MultiversXAccount);
};

describe("MultiversX currency bridge scanAccounts (integration)", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async (_address, _currencyId, identifier) =>
        identifier === "MEX-455c57" ? MEX_TOKEN : undefined,
      findTokenById: async id => (id === MEX_TOKEN.id ? MEX_TOKEN : undefined),
      getTokensSyncHash: async () => "0",
    });
  });

  it("discovers a used account followed by an unused account", async () => {
    const accounts = await scanWith([FUNDED_ADDRESS, NEXT_ADDRESS]);

    expect(accounts.map(account => account.used)).toEqual([true, false]);
  });

  it("derives the id, path and address fields of the discovered accounts", async () => {
    const accounts = await scanWith([FUNDED_ADDRESS, NEXT_ADDRESS]);

    expect(accounts).toMatchObject([
      {
        id: `js:2:elrond:${FUNDED_ADDRESS}:`,
        index: 0,
        derivationMode: "",
        seedIdentifier: "public-key-0",
        freshAddress: FUNDED_ADDRESS,
        freshAddressPath: "44'/508'/0'/0/0",
      },
      {
        id: `js:2:elrond:${NEXT_ADDRESS}:`,
        index: 1,
        derivationMode: "",
        freshAddress: NEXT_ADDRESS,
        freshAddressPath: "44'/508'/1'/0/0",
      },
    ]);
  });

  it("fills the multiversx resources and the operations of the used account", async () => {
    const [used] = await scanWith([FUNDED_ADDRESS, NEXT_ADDRESS]);

    expect({
      hasOperations: used.operationsCount > 0,
      operationsCountMatches: used.operationsCount === used.operations.length,
      blockHeightIsPositive: used.blockHeight > 0,
      resources: {
        nonceIsPositive: used.multiversxResources.nonce > 0,
        delegationsIsArray: Array.isArray(used.multiversxResources.delegations),
        isGuarded: typeof used.multiversxResources.isGuarded,
      },
    }).toEqual({
      hasOperations: true,
      operationsCountMatches: true,
      blockHeightIsPositive: true,
      resources: { nonceIsPositive: true, delegationsIsArray: true, isGuarded: "boolean" },
    });
  });

  it("maps every fetched transaction to an operation with typed amounts and addresses", async () => {
    const [used] = await scanWith([FUNDED_ADDRESS, NEXT_ADDRESS]);

    const invalidOperations = used.operations.filter(
      op =>
        !BigNumber.isBigNumber(op.value) ||
        !BigNumber.isBigNumber(op.fee) ||
        !op.hash ||
        !["IN", "OUT", "FEES", "DELEGATE", "UNDELEGATE", "WITHDRAW_UNBONDED", "REWARD"].includes(
          op.type,
        ),
    );

    expect(invalidOperations).toEqual([]);
  });

  it("does not duplicate operations of the used account", async () => {
    const [used] = await scanWith([FUNDED_ADDRESS, NEXT_ADDRESS]);

    const ids = used.operations.map(op => op.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reports no operation and a zero balance for the unused account", async () => {
    const accounts = await scanWith([FUNDED_ADDRESS, NEXT_ADDRESS]);
    const unused = accounts[1];

    expect({
      operationsCount: unused.operationsCount,
      balance: unused.balance.toString(),
    }).toEqual({ operationsCount: 0, balance: "0" });
  });

  it("builds the MEX token sub account of an account holding ESDT tokens", async () => {
    const [holder] = await scanWith([TOKEN_HOLDER_ADDRESS, NEXT_ADDRESS]);

    expect(holder.subAccounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "TokenAccount",
          parentId: holder.id,
          token: expect.objectContaining({ id: MEX_TOKEN.id }),
        }),
      ]),
    );
  });
});
