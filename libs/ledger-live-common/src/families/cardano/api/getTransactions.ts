import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import chunk from "lodash/chunk";
import range from "lodash/range";
import { getEnv } from "../../../env";
import {
  CARDANO_API_ENDPOINT,
  CARDANO_TESTNET_API_ENDPOINT,
} from "../constants";
import {
  getBipPath,
  getCredentialKey,
  getExtendedPublicKeyFromHex,
  isTestnet,
} from "../logic";
import { CardanoAccount, PaymentChain, PaymentCredential } from "../types";
import * as ApiTypes from "./api-types";
import { APITransaction } from "./api-types";

async function fetchTransactions(
  paymentKeys: Array<string>,
  pageNo: number,
  blockHeight: number,
  currency: CryptoCurrency
): Promise<{
  pageNo: number;
  limit: number;
  blockHeight: number;
  transactions: Array<APITransaction>;
}> {
  const res = await network({
    method: "POST",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/transaction`
      : `${CARDANO_API_ENDPOINT}/v1/transaction`,
    data: {
      paymentKeys,
      pageNo,
      blockHeight,
    },
  });
  return res.data;
}

async function getAllTransactionsByKeys(
  paymentKeys: Array<string>,
  blockHeight: number,
  currency: CryptoCurrency
): Promise<{
  transactions: Array<ApiTypes.APITransaction>;
  blockHeight: number;
}> {
  const transactions: Array<ApiTypes.APITransaction> = [];
  let latestBlockHeight = 0;
  let isAllTrxFetched = false;
  let pageNo = 1;

  while (!isAllTrxFetched) {
    const res = await fetchTransactions(
      paymentKeys,
      pageNo,
      blockHeight,
      currency
    );
    transactions.push(...res.transactions);
    latestBlockHeight = Math.max(res.blockHeight, latestBlockHeight);
    isAllTrxFetched = res.transactions.length < res.limit;
    pageNo += 1;
  }
  return {
    transactions,
    blockHeight: latestBlockHeight,
  };
}

async function getSyncedTransactionsByChain(
  accountPubKey: Bip32PublicKey,
  accountIndex: number,
  chainType: PaymentChain,
  blockHeight: number,
  initialPaymentCredentials: Array<PaymentCredential>,
  currency: CryptoCurrency
): Promise<{
  transactions: Array<ApiTypes.APITransaction>;
  latestBlockHeight: number;
  paymentCredentials: Array<PaymentCredential>;
}> {
  const keyChainRange = getEnv("KEYCHAIN_OBSERVABLE_RANGE") || 20;

  // credentialsMap for efficient use
  const initialPaymentCredentialMap: Record<string, PaymentCredential> = {};
  let maxUsedKeyIndex = -1;
  initialPaymentCredentials.forEach((cred) => {
    initialPaymentCredentialMap[cred.key] = cred;
    if (cred.isUsed) maxUsedKeyIndex = cred.path.index;
  });

  const transactions: Array<ApiTypes.APITransaction> = [];
  let latestBlockHeight = 0;

  // fetch transactions for existing keys
  const trxsRes = await Promise.all(
    chunk(Object.keys(initialPaymentCredentialMap), keyChainRange).map((keys) =>
      getAllTransactionsByKeys(keys, blockHeight, currency)
    )
  );
  trxsRes.forEach((txRes) => {
    transactions.push(...txRes.transactions);
    latestBlockHeight = Math.max(latestBlockHeight, txRes.blockHeight);
  });

  // fetch transactions for new avaialble keys
  let newPaymentCredentialsMap: Record<string, PaymentCredential> = {};
  let lastSyncedKeyIndex = initialPaymentCredentials.length
    ? initialPaymentCredentials[initialPaymentCredentials.length - 1].path.index
    : -1;
  let syncToKeyIndex = maxUsedKeyIndex + keyChainRange;
  while (syncToKeyIndex !== lastSyncedKeyIndex) {
    const currentPaymentKeysMap: Record<string, PaymentCredential> = {};
    range(lastSyncedKeyIndex + 1, syncToKeyIndex + 1, 1).forEach((keyIndex) => {
      const keyPath = getCredentialKey(
        accountPubKey,
        getBipPath({
          account: accountIndex,
          chain: chainType,
          index: keyIndex,
        })
      );
      currentPaymentKeysMap[keyPath.key] = {
        isUsed: false,
        key: keyPath.key,
        path: keyPath.path,
      };
    });
    const trxRes = await getAllTransactionsByKeys(
      Object.keys(currentPaymentKeysMap),
      blockHeight,
      currency
    );
    transactions.push(...trxRes.transactions);

    lastSyncedKeyIndex = syncToKeyIndex;
    latestBlockHeight = Math.max(latestBlockHeight, trxRes.blockHeight);
    newPaymentCredentialsMap = Object.assign(
      {},
      newPaymentCredentialsMap,
      currentPaymentKeysMap
    );
    maxUsedKeyIndex = trxRes.transactions.reduce(
      (maxIndexA, { inputs, outputs }) =>
        [...inputs, ...outputs].reduce(
          (maxIndexB, io) =>
            Math.max(
              newPaymentCredentialsMap[io.paymentKey]?.path.index || -1,
              maxIndexB
            ),
          maxIndexA
        ),
      maxUsedKeyIndex
    );
    syncToKeyIndex = maxUsedKeyIndex + keyChainRange;
  }

  const availablePaymentCredentialsMap = {
    ...initialPaymentCredentialMap,
    ...newPaymentCredentialsMap,
  };
  transactions.forEach((trx) => {
    [...trx.inputs, ...trx.outputs].forEach((io) => {
      if (availablePaymentCredentialsMap[io.paymentKey]) {
        availablePaymentCredentialsMap[io.paymentKey].isUsed = true;
      }
    });
  });

  return {
    transactions,
    latestBlockHeight,
    paymentCredentials: Object.values(availablePaymentCredentialsMap).sort(
      (aCred, bCred) => aCred.path.index - bCred.path.index
    ),
  };
}

export async function getTransactions(
  xpub: string,
  accountIndex: number,
  initialAccount: CardanoAccount | undefined,
  blockHeight: number,
  currency: CryptoCurrency
): Promise<{
  transactions: Array<ApiTypes.APITransaction>;
  blockHeight: number;
  externalCredentials: Array<PaymentCredential>;
  internalCredentials: Array<PaymentCredential>;
}> {
  const accountPubKey = getExtendedPublicKeyFromHex(xpub);
  const oldExternalCredentials =
    initialAccount?.cardanoResources?.externalCredentials || [];
  const oldInternalCredentials =
    initialAccount?.cardanoResources?.internalCredentials || [];

  const [
    {
      transactions: externalKeyTransactions,
      latestBlockHeight: aBlockHeight,
      paymentCredentials: externalCredentials,
    },
    {
      transactions: internalKeyTransactions,
      latestBlockHeight: bBlockHeight,
      paymentCredentials: internalCredentials,
    },
  ] = await Promise.all([
    getSyncedTransactionsByChain(
      accountPubKey,
      accountIndex,
      PaymentChain.external,
      blockHeight,
      oldExternalCredentials,
      currency
    ),
    getSyncedTransactionsByChain(
      accountPubKey,
      accountIndex,
      PaymentChain.internal,
      blockHeight,
      oldInternalCredentials,
      currency
    ),
  ]);

  return {
    transactions: [...externalKeyTransactions, ...internalKeyTransactions],
    blockHeight: Math.max(aBlockHeight, bBlockHeight),
    externalCredentials,
    internalCredentials,
  };
}
