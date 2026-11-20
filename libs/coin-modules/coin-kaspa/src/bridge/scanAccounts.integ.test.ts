import ecc from "@bitcoinerlab/secp256k1";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import BIP32Factory from "bip32";
import BigNumber from "bignumber.js";
import { randomBytes } from "node:crypto";
import { lastValueFrom, toArray } from "rxjs";
import { isValidKaspaAddress } from "../logic";
import { XPUB } from "../test/fixtures";
import type { KaspaAccount, KaspaSigner } from "../types";
import { createBridges } from "./index";

const buildUnusedXpub = (): string => {
  const node = BIP32Factory(ecc).fromSeed(randomBytes(32));
  const uncompressed = Buffer.from(ecc.pointCompress(node.publicKey, false));

  return Buffer.concat([
    Buffer.from([0x41]),
    uncompressed,
    Buffer.from([0x20]),
    node.chainCode,
  ]).toString("hex");
};

const UNUSED_XPUB = buildUnusedXpub();

const isValidAmount = (amount: BigNumber): boolean =>
  BigNumber.isBigNumber(amount) && !amount.isNaN();

const scan = async (): Promise<KaspaAccount[]> => {
  const xpubs = [XPUB, UNUSED_XPUB];
  const signer: KaspaSigner = {
    getAddress: async (path: string) => {
      const index = Number(/^44'\/111111'\/(\d+)'/.exec(path)?.[1]);
      const publicKey = xpubs[index];
      if (!publicKey) throw new Error(`unexpected derivation path ${path}`);
      return { address: `kaspa-placeholder-${index}`, publicKey };
    },
    signMessage: async () => ({ signature: "" }),
    signTransaction: async () => undefined,
  };
  const signerContext = ((_deviceId: string, fn: (signer: KaspaSigner) => unknown) =>
    fn(signer)) as unknown as SignerContext<KaspaSigner>;

  const events = await lastValueFrom(
    createBridges(signerContext)
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("kaspa"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as KaspaAccount);
};

describe("Kaspa currency bridge scanAccounts (integration)", () => {
  let accounts: KaspaAccount[];

  beforeAll(async () => {
    accounts = await scan();
  }, 240_000);

  it("discovers a used account followed by an unused account", () => {
    expect(accounts.map(account => account.used)).toEqual([true, false]);
  });

  it("derives the id, path and address fields of the discovered accounts", () => {
    expect(accounts).toMatchObject([
      {
        id: `js:2:kaspa:${XPUB}:`,
        index: 0,
        derivationMode: "",
        xpub: XPUB,
      },
      {
        id: `js:2:kaspa:${UNUSED_XPUB}:`,
        index: 1,
        derivationMode: "",
        xpub: UNUSED_XPUB,
        freshAddressPath: "44'/111111'/1'/0/0",
        operationsCount: 0,
      },
    ]);
  });

  it("derives valid kaspa addresses and consistent fresh address paths", () => {
    const [used] = accounts;

    expect({
      freshAddressIsValid: isValidKaspaAddress(used.freshAddress),
      freshAddressIsNextReceive: used.freshAddress === used.nextReceiveAddress,
      nextChangeIsValid: isValidKaspaAddress(used.nextChangeAddress),
      pathMatchesNextReceive:
        used.freshAddressPath ===
        `44'/111111'/0'/${used.nextReceiveAddressType}/${used.nextReceiveAddressIndex}`,
    }).toEqual({
      freshAddressIsValid: true,
      freshAddressIsNextReceive: true,
      nextChangeIsValid: true,
      pathMatchesNextReceive: true,
    });
  });

  it("fills the balances, the block height and the sync timestamp of the used account", () => {
    const [used] = accounts;

    expect({
      balanceIsAmount: isValidAmount(used.balance),
      spendableIsAmount: isValidAmount(used.spendableBalance),
      spendableWithinBalance: used.spendableBalance.lte(used.balance),
      blockHeightIsPositive: used.blockHeight > 0,
      lastSyncTimestampIsPositive: used.lastSyncTimestamp > 0,
    }).toEqual({
      balanceIsAmount: true,
      spendableIsAmount: true,
      spendableWithinBalance: true,
      blockHeightIsPositive: true,
      lastSyncTimestampIsPositive: true,
    });
  });

  it("maps every fetched transaction to an operation with typed amounts and addresses", () => {
    const [used] = accounts;

    const invalidOperations = used.operations.filter(
      op =>
        !isValidAmount(op.value) ||
        !isValidAmount(op.fee) ||
        !op.hash ||
        !["IN", "OUT"].includes(op.type) ||
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

  it("reports no operation and a zero balance for the unused account", () => {
    const unused = accounts[1];

    expect({
      operationsCount: unused.operationsCount,
      balance: unused.balance.toString(),
    }).toEqual({ operationsCount: 0, balance: "0" });
  });
});
