import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { cardanoTestnetCoinConfig, createMockContext } from "../fixtures/config";
import type { CardanoSigner } from "../signer";
import { ACCOUNT_KEYS } from "../test/fixtures";
import type { CardanoAccount } from "../types";
import { createBridges } from "./index";

const tokensById = new Map<string, TokenCurrency>();

const buildToken = (policyId: string, assetName: string | undefined): TokenCurrency => {
  const assetId = `${policyId}${assetName ?? ""}`;
  const id = `cardano_testnet/native/${assetId}`;
  const known = tokensById.get(id);
  if (known) return known;

  const token = {
    type: "TokenCurrency",
    id,
    contractAddress: assetId,
    parentCurrencyId: "cardano_testnet",
    tokenType: "native",
    name: assetId,
    ticker: assetId,
    units: [{ name: assetId, code: assetId, magnitude: 0 }],
  } as unknown as TokenCurrency;
  tokensById.set(id, token);

  return token;
};

const KNOWN_TOKEN_ID =
  "cardano_testnet/native/47be64fcc8a7fe5321b976282ce4e43e4d29015f6613cfabcea28eab54657374";
const KNOWN_TOKEN_OPERATION_HASH = // gitleaks:allow
  "6c8f2922d87f6d321bac3c6e4987985bdff16a3c840c0f6fab9412420a2df7af";

const KNOWN_OPERATIONS = [
  { hash: KNOWN_TOKEN_OPERATION_HASH, type: "IN", value: "1344798", fee: "188689" },
  {
    hash: "1bc0f281044d852d6390c7977ff6cbf446e315c6b8879e1fa0dcc021372ac5e3",
    type: "DELEGATE",
    value: "172805",
    fee: "172805",
  },
  {
    hash: "cdfd34431c6345e7dafc3a32f0f90e5805b7d12eb9d1083e837645d7fd682bd6",
    type: "DELEGATE",
    value: "2174301",
    fee: "174301",
  },
  {
    hash: "9b5428b372e50265ee588a28e67f547b0b24e5d8c3f191cac7ed6479c53e397a",
    type: "IN",
    value: "200000000",
    fee: "168317",
  },
  {
    hash: "ecde338c38caf74209773ca95be32db75cdeff0c1edf5fc9ddad35f21f4de94e",
    type: "OUT",
    value: "100168317",
    fee: "168317",
  },
  {
    hash: "5a79cec1f369c234d11ce12fd06b39ef60aa32e344be2485033af462cd879034",
    type: "IN",
    value: "10000000000",
    fee: "200000",
  },
];

const isValidAmount = (amount: BigNumber): boolean =>
  BigNumber.isBigNumber(amount) && !amount.isNaN();

const signer: CardanoSigner = {
  getAddress: async ({ path }) => {
    const index = Number(/^1852'\/1815'\/(\d+)'/.exec(path)?.[1]);
    const keys = ACCOUNT_KEYS[index];
    if (!keys) throw new Error(`unexpected derivation path ${path}`);
    return { addressHex: keys.addressHex };
  },
  getPublicKey: async accountPath => {
    const index = Number(/^1852'\/1815'\/(\d+)'$/.exec(accountPath)?.[1]);
    const keys = ACCOUNT_KEYS[index];
    if (!keys) throw new Error(`unexpected account path ${accountPath}`);
    return { publicKeyHex: keys.publicKeyHex, chainCodeHex: keys.chainCodeHex };
  },
  sign: async () => {
    throw new Error("signing is not expected");
  },
};

const signerContext = ((_deviceId: string, fn: (signer: CardanoSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<CardanoSigner>;

const scan = async (): Promise<CardanoAccount[]> => {
  const events = await lastValueFrom(
    createBridges(
      signerContext,
      createMockContext(() => cardanoTestnetCoinConfig),
    )
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("cardano_testnet"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as CardanoAccount);
};

describe("Cardano currency bridge scanAccounts (integration)", () => {
  let accounts: CardanoAccount[];

  beforeAll(async () => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async (policyId, _currencyId, assetName) =>
        buildToken(policyId, assetName),
      findTokenById: async id =>
        id.startsWith("cardano_testnet/native/")
          ? buildToken(id.slice(23, 79), id.slice(79) || undefined)
          : undefined,
      getTokensSyncHash: async () => "stub-sync-hash",
    });
    accounts = await scan();
  }, 240_000);

  it("discovers a used account followed by an unused account", () => {
    expect(accounts.map(account => account.used)).toEqual([true, false]);
  });

  it("derives the id, derivation mode and path fields of the discovered accounts", () => {
    const xpubs = ACCOUNT_KEYS.map(keys => keys.publicKeyHex + keys.chainCodeHex);

    expect(accounts).toMatchObject([
      {
        id: `js:2:cardano_testnet:${xpubs[0]}:cardano`,
        index: 0,
        derivationMode: "cardano",
        xpub: xpubs[0],
      },
      {
        id: `js:2:cardano_testnet:${xpubs[1]}:cardano`,
        index: 1,
        derivationMode: "cardano",
        xpub: xpubs[1],
        freshAddressPath: "1852'/1815'/1'/0/0",
        operationsCount: 0,
      },
    ]);
  });

  it("exposes the credentials, the protocol parameters of the used account", () => {
    const [used] = accounts;
    const { externalCredentials, internalCredentials, protocolParams } = used.cardanoResources;

    expect({
      hasUsedExternalCredential: externalCredentials.some(credential => credential.isUsed),
      hasUnusedExternalCredential: externalCredentials.some(credential => !credential.isUsed),
      internalCredentialsAreArray: Array.isArray(internalCredentials),
      protocolParamsHaveFees:
        Number(protocolParams.minFeeA) > 0 && Number(protocolParams.minFeeB) > 0,
    }).toEqual({
      hasUsedExternalCredential: true,
      hasUnusedExternalCredential: true,
      internalCredentialsAreArray: true,
      protocolParamsHaveFees: true,
    });
  });

  it("fills the balances and the block height of the used account", () => {
    const [used] = accounts;

    expect({
      balanceIsAmount: isValidAmount(used.balance),
      spendableIsAmount: isValidAmount(used.spendableBalance),
      spendableWithinBalance: used.spendableBalance.lte(used.balance),
      blockHeightIsPositive: used.blockHeight > 0,
    }).toEqual({
      balanceIsAmount: true,
      spendableIsAmount: true,
      spendableWithinBalance: true,
      blockHeightIsPositive: true,
    });
  });

  it("maps the known testnet history of the used account to operations", () => {
    const [used] = accounts;

    expect(used.operations).toEqual(
      expect.arrayContaining(
        KNOWN_OPERATIONS.map(known =>
          expect.objectContaining({
            hash: known.hash,
            type: known.type,
            value: new BigNumber(known.value),
            fee: new BigNumber(known.fee),
          }),
        ),
      ),
    );
  });

  it("maps every fetched transaction to an operation with typed amounts and addresses", () => {
    const [used] = accounts;

    const invalidOperations = used.operations.filter(
      op =>
        !isValidAmount(op.value) ||
        !isValidAmount(op.fee) ||
        op.hash.length !== 64 ||
        op.senders.length === 0 ||
        op.recipients.length === 0,
    );

    expect({
      hasOperations: used.operationsCount > 0 && used.operationsCount === used.operations.length,
      invalidOperations,
    }).toEqual({ hasOperations: true, invalidOperations: [] });
  });

  it("does not duplicate operations of the used account", () => {
    const [used] = accounts;

    const ids = used.operations.map(op => op.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds the token sub account holding the known token receive", () => {
    const [used] = accounts;
    const tokenAccount = used.subAccounts?.find(
      subAccount => subAccount.token.id === KNOWN_TOKEN_ID,
    );

    expect(tokenAccount).toMatchObject({
      type: "TokenAccount",
      parentId: used.id,
      operations: expect.arrayContaining([
        expect.objectContaining({
          hash: KNOWN_TOKEN_OPERATION_HASH,
          type: "IN",
          value: new BigNumber(100),
        }),
      ]),
    });
  });

  it("builds only valid token sub accounts attached to the used account", () => {
    const [used] = accounts;

    const invalidSubAccounts = (used.subAccounts ?? []).filter(
      subAccount =>
        subAccount.type !== "TokenAccount" ||
        subAccount.parentId !== used.id ||
        !isValidAmount(subAccount.balance) ||
        subAccount.operations.some(op => !isValidAmount(op.value) || !isValidAmount(op.fee)),
    );

    expect(invalidSubAccounts).toEqual([]);
  });

  it("reports no operation and a zero balance for the unused account", () => {
    const unused = accounts[1];

    expect({
      operationsCount: unused.operationsCount,
      balance: unused.balance.toString(),
    }).toEqual({ operationsCount: 0, balance: "0" });
  });
});
