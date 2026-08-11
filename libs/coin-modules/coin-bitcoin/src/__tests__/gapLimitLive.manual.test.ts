/**
 * MANUAL / NETWORK harness for PR #20538 (fix(bitcoin): gap limit handle).
 *
 * Not part of CI. Hits the real explorer. Untracked scratch file.
 *
 * It drives the real Bitcoin currency bridge, so the code under test is the
 * patched `makeScanAccounts` in @ledgerhq/ledger-wallet-framework. No device and
 * no Speculos: the signer derives xpubs and addresses locally from a mnemonic,
 * which is exactly what a device would return for the same seed.
 *
 * Run:
 *   MNEMONIC="<12 words>" CURRENCY=bitcoin_testnet GAP=20 \
 *     pnpm exec jest src/__tests__/gapLimitLive.manual.test.ts
 */
import { pbkdf2Sync } from "crypto";
import BIP32Factory from "bip32";
import * as ecc from "@bitcoinerlab/secp256k1";
import * as bitcoinjs from "bitcoinjs-lib";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { createBridges } from "../bridge/js";
import type {
  AddressFormat,
  BitcoinAddress,
  BitcoinSignature,
  BitcoinSigner,
  BitcoinXPub,
  SignerTransaction,
} from "../signer";

const bip32 = BIP32Factory(ecc);

// BIP39 test-vector mnemonic. Override with MNEMONIC=...
const MNEMONIC =
  process.env.MNEMONIC ??
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const CURRENCY_ID = process.env.CURRENCY ?? "bitcoin_testnet";
const GAP = Number(process.env.GAP ?? 20);

// BIP39 seed derivation: PBKDF2-HMAC-SHA512, salt "mnemonic" + passphrase, 2048 rounds.
const seed = pbkdf2Sync(MNEMONIC.normalize("NFKD"), "mnemonic", 2048, 64, "sha512");

const networkFor = (currency: CryptoCurrency, xpubVersion: number): bitcoinjs.Network => ({
  ...(currency.id === "bitcoin" ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet),
  bip32: {
    public: xpubVersion,
    private:
      currency.id === "bitcoin"
        ? bitcoinjs.networks.bitcoin.bip32.private
        : bitcoinjs.networks.testnet.bip32.private,
  },
});

const isTestnet = CURRENCY_ID !== "bitcoin";

const localSigner = (currency: CryptoCurrency): BitcoinSigner => ({
  // The account-shape path: what the device returns for the account-level path.
  getWalletXpub: ({
    path,
    xpubVersion,
  }: {
    path: string;
    xpubVersion: number;
  }): Promise<BitcoinXPub> => {
    const root = bip32.fromSeed(seed, networkFor(currency, xpubVersion));
    return Promise.resolve(root.derivePath(path).neutered().toBase58());
  },
  // The scan's getAddressFn path.
  getWalletPublicKey: (
    path: string,
    _opts?: { verify?: boolean; format?: AddressFormat },
  ): Promise<BitcoinAddress> => {
    const network = isTestnet ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;
    const node = bip32.fromSeed(seed, network).derivePath(path);
    const { address } = bitcoinjs.payments.p2wpkh({
      pubkey: Buffer.from(node.publicKey),
      network,
    });
    return Promise.resolve({
      publicKey: Buffer.from(node.publicKey).toString("hex"),
      bitcoinAddress: address ?? "",
      chainCode: Buffer.from(node.chainCode).toString("hex"),
    });
  },
  signMessage: (): Promise<BitcoinSignature> => Promise.reject(new Error("not needed")),
  splitTransaction: (): SignerTransaction => {
    throw new Error("not needed");
  },
  createPaymentTransaction: (): Promise<string> => Promise.reject(new Error("not needed")),
  signPsbt: (): Promise<Buffer> => Promise.reject(new Error("not needed")),
  getWalletAddress: (): Promise<string> => Promise.reject(new Error("not needed")),
  registerWallet: (): Promise<Buffer> => Promise.reject(new Error("not needed")),
});

describe(`gap limit against the real explorer (${CURRENCY_ID})`, () => {
  it(
    "reports which account indices discovery returns",
    async () => {
      const currency = getCryptoCurrencyById(CURRENCY_ID) as unknown as CryptoCurrency;
      const previousGap = getEnv("KEYCHAIN_OBSERVABLE_RANGE");
      setEnv("KEYCHAIN_OBSERVABLE_RANGE", GAP);

      const signerContext = <T,>(
        _deviceId: string,
        crypto: CryptoCurrency,
        fn: (signer: BitcoinSigner) => Promise<T>,
      ): Promise<T> => fn(localSigner(crypto));

      const { currencyBridge } = createBridges(
        signerContext as never,
        (() => ({ info: { status: { type: "active" } } })) as never,
      );

      const discovered: Account[] = [];
      await new Promise<void>((resolve, reject) => {
        currencyBridge
          .scanAccounts({
            currency,
            deviceId: "manual",
            syncConfig: { paginationConfig: {} },
          })
          .subscribe({
            next: e => {
              if (e.type === "discovered") discovered.push(e.account);
            },
            complete: () => resolve(),
            error: reject,
          });
      });

      setEnv("KEYCHAIN_OBSERVABLE_RANGE", previousGap);

      const rows = discovered.map(a => ({
        derivationMode: a.derivationMode || "(default)",
        index: a.index,
        used: a.used,
        balance: a.balance.toString(),
        operations: a.operationsCount,
      }));
      // eslint-disable-next-line no-console
      console.log(`GAP=${GAP} ${CURRENCY_ID}\n` + JSON.stringify(rows, null, 2));

      expect(discovered.length).toBeGreaterThan(0);
    },
    30 * 60 * 1000,
  );
});
