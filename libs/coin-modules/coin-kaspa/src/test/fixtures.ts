import BigNumber from "bignumber.js";
import { createTransaction } from "../bridge/createTransaction";
import type { KaspaAccount, KaspaUtxo, Transaction } from "../types";

export const XPUB =
  "41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a5576";
export const SECOND_XPUB =
  "4104751b5ebd4a9d2a0a25d5c37cab4814a95335b8945cfcaa6a4138de418f581bb1d0d02f22081b3cda223a51e18a63ebdffd64803e0988b68a91802738a5a9f901206d4a2b989a82b5fb160f0151ea5d046451a291a0748f3038ecdc63d637cce00b";

export const SCHNORR_RECIPIENT =
  "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee";
export const ECDSA_RECIPIENT =
  "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

export const DUST_LIMIT = 20000000;

export const buildUtxos = (count: number, amount: string | number): KaspaUtxo[] =>
  Array.from(
    { length: count },
    (_, index) =>
      ({
        address: SCHNORR_RECIPIENT,
        outpoint: { transactionId: index.toString(16).padStart(64, "0"), index },
        utxoEntry: {
          amount: new BigNumber(amount),
          scriptPublicKey: { version: 0, scriptPublicKey: "" },
          blockDaaScore: String(1000 + index),
          isCoinbase: false,
        },
        accountType: 0,
        accountIndex: 0,
      }) as KaspaUtxo,
  );

let accountCounter = 0;

export const buildAccount = ({
  balance = "0",
}: { balance?: string | number } = {}): KaspaAccount => {
  accountCounter += 1;
  return {
    type: "Account",
    id: `js:2:kaspa:${XPUB}:${accountCounter}`,
    xpub: XPUB,
    currency: { id: "kaspa", name: "Kaspa" },
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
  } as unknown as KaspaAccount;
};

export const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  ...createTransaction(),
  recipient: SCHNORR_RECIPIENT,
  amount: new BigNumber(DUST_LIMIT),
  feesStrategy: "custom",
  customFeeRate: new BigNumber(1),
  ...overrides,
});
