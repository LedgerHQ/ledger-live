import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import coinConfig, { cardanoDefaults } from "./config";
import type { CardanoSigner } from "./signer";
import { makeGetAccountShape } from "./synchronisation";
import type { CardanoAccount, CardanoOutput, PaymentCredential } from "./types";

const xpub =
  "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d";
const requiredConfirmations = 90;
const syncOptions = { blacklistedTokenIds: [], paginationConfig: {} };

const signerContext: SignerContext<CardanoSigner> = (_deviceId, fn) =>
  fn({
    getAddress: jest.fn(),
    sign: jest.fn(),
    getPublicKey: jest.fn().mockResolvedValue({
      publicKeyHex: xpub.slice(0, 64),
      chainCodeHex: xpub.slice(64),
    }),
  });
const getAccountShape = makeGetAccountShape(signerContext);

const syncWithRange = async (keychainObservableRange: number, initialAccount?: CardanoAccount) => {
  coinConfig.setCoinConfig(() => ({ ...cardanoDefaults.cardano_testnet, keychainObservableRange }));
  const info = {
    currency: getCryptoCurrencyById("cardano_testnet"),
    address: "",
    index: 0,
    derivationPath: "1852'/1815'/0'",
    derivationMode: "cardano",
    deviceId: "deviceId",
    initialAccount,
  } as AccountShapeInfo<CardanoAccount>;
  return (await getAccountShape(info, syncOptions)) as CardanoAccount;
};

const isFirstAddress = ({ path }: Pick<PaymentCredential, "path">) => path.index === 0;
const operationHashes = (account: CardanoAccount) =>
  [...new Set(account.operations.map(op => op.hash))].sort();
const utxoIds = (utxos: Array<CardanoOutput>) => utxos.map(u => `${u.hash}#${u.index}`).sort();
const usedIndexes = (credentials: Array<PaymentCredential>) =>
  credentials.filter(c => c.isUsed).map(c => c.path.index);

describe("makeGetAccountShape (integration)", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "stub-sync-hash",
    });
  });

  it("rebuilds the history of addresses beyond the previous range when the range increases", async () => {
    const smallRangeAccount = await syncWithRange(1);
    const [latestOperation] = smallRangeAccount.operations;
    const staleAccount = {
      ...smallRangeAccount,
      operations: [latestOperation],
      cardanoResources: {
        ...smallRangeAccount.cardanoResources,
        externalCredentials:
          smallRangeAccount.cardanoResources.externalCredentials.filter(isFirstAddress),
        internalCredentials:
          smallRangeAccount.cardanoResources.internalCredentials.filter(isFirstAddress),
        utxos: smallRangeAccount.cardanoResources.utxos.filter(
          u => u.hash === latestOperation.hash && isFirstAddress(u.paymentCredential),
        ),
      },
    } as CardanoAccount;
    const staleSyncCursor = (latestOperation.blockHeight ?? 0) + 1 - requiredConfirmations;

    const freshAccount = await syncWithRange(20);
    const increasedRangeAccount = await syncWithRange(20, staleAccount);

    expect(increasedRangeAccount.syncHash).not.toEqual(staleAccount.syncHash);
    expect(
      increasedRangeAccount.operations.some(op => (op.blockHeight ?? 0) < staleSyncCursor),
    ).toBe(true);
    expect(operationHashes(increasedRangeAccount)).toEqual(operationHashes(freshAccount));
    expect(utxoIds(increasedRangeAccount.cardanoResources.utxos)).toEqual(
      utxoIds(freshAccount.cardanoResources.utxos),
    );
    expect(increasedRangeAccount.balance).toEqual(freshAccount.balance);
    expect(usedIndexes(increasedRangeAccount.cardanoResources.externalCredentials)).toEqual(
      usedIndexes(freshAccount.cardanoResources.externalCredentials),
    );
    expect(usedIndexes(increasedRangeAccount.cardanoResources.internalCredentials)).toEqual(
      usedIndexes(freshAccount.cardanoResources.internalCredentials),
    );
  }, 120000);
});
