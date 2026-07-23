import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import chunk from "lodash/chunk";
import range from "lodash/range";
import { getBipPath, getCredentialKey, getExtendedPublicKeyFromHex } from "../logic";
import { CardanoAccount, PaymentChain, PaymentCredential } from "../types";
import * as ApiTypes from "./api-types";
import { getAllTransactionsByKeys } from "./fetchTransactions";

async function getSyncedTransactionsByChain(
  accountPubKey: Bip32PublicKey,
  accountIndex: number,
  chainType: PaymentChain,
  blockHeight: number,
  initialPaymentCredentials: Array<PaymentCredential>,
  currency: CryptoCurrency,
): Promise<{
  transactions: Array<ApiTypes.APITransaction>;
  latestBlockHeight: number;
  paymentCredentials: Array<PaymentCredential>;
}> {
  const keyChainRange = getEnv("KEYCHAIN_OBSERVABLE_RANGE") || 20;

  // credentialsMap for efficient use
  const initialPaymentCredentialMap: Record<string, PaymentCredential> = {};
  let maxUsedKeyIndex = -1;
  initialPaymentCredentials.forEach(cred => {
    initialPaymentCredentialMap[cred.key] = cred;
    if (cred.isUsed) maxUsedKeyIndex = cred.path.index;
  });

  const transactions: Array<ApiTypes.APITransaction> = [];
  let latestBlockHeight = 0;

  // fetch transactions for existing keys
  const trxsRes = await Promise.all(
    chunk(Object.keys(initialPaymentCredentialMap), keyChainRange).map(keys =>
      getAllTransactionsByKeys(keys, blockHeight, currency),
    ),
  );
  trxsRes.forEach(txRes => {
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
    range(lastSyncedKeyIndex + 1, syncToKeyIndex + 1, 1).forEach(keyIndex => {
      const keyPath = getCredentialKey(
        accountPubKey,
        getBipPath({
          account: accountIndex,
          chain: chainType,
          index: keyIndex,
        }),
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
      currency,
    );
    transactions.push(...trxRes.transactions);

    lastSyncedKeyIndex = syncToKeyIndex;
    latestBlockHeight = Math.max(latestBlockHeight, trxRes.blockHeight);
    newPaymentCredentialsMap = Object.assign({}, newPaymentCredentialsMap, currentPaymentKeysMap);
    maxUsedKeyIndex = trxRes.transactions.reduce(
      (maxIndexA, { inputs, outputs }) =>
        [...inputs, ...outputs].reduce(
          (maxIndexB, io) =>
            Math.max(newPaymentCredentialsMap[io.paymentKey]?.path.index || -1, maxIndexB),
          maxIndexA,
        ),
      maxUsedKeyIndex,
    );
    syncToKeyIndex = maxUsedKeyIndex + keyChainRange;
  }

  const availablePaymentCredentialsMap = {
    ...initialPaymentCredentialMap,
    ...newPaymentCredentialsMap,
  };
  transactions.forEach(trx => {
    [...trx.inputs, ...trx.outputs].forEach(io => {
      const credential = availablePaymentCredentialsMap[io.paymentKey];
      if (credential) {
        availablePaymentCredentialsMap[io.paymentKey] = { ...credential, isUsed: true };
      }
    });
  });

  return {
    transactions,
    latestBlockHeight,
    paymentCredentials: Object.values(availablePaymentCredentialsMap).sort(
      (aCred, bCred) => aCred.path.index - bCred.path.index,
    ),
  };
}

export async function getTransactions(
  xpub: string,
  accountIndex: number,
  initialAccount: CardanoAccount | undefined,
  blockHeight: number,
  currency: CryptoCurrency,
): Promise<{
  transactions: Array<ApiTypes.APITransaction>;
  blockHeight: number;
  externalCredentials: Array<PaymentCredential>;
  internalCredentials: Array<PaymentCredential>;
}> {
  const accountPubKey = getExtendedPublicKeyFromHex(xpub);
  const oldExternalCredentials = initialAccount?.cardanoResources?.externalCredentials || [];
  const oldInternalCredentials = initialAccount?.cardanoResources?.internalCredentials || [];

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
      currency,
    ),
    getSyncedTransactionsByChain(
      accountPubKey,
      accountIndex,
      PaymentChain.internal,
      blockHeight,
      oldInternalCredentials,
      currency,
    ),
  ]);

  return {
    transactions: [...externalKeyTransactions, ...internalKeyTransactions],
    blockHeight: Math.max(aBlockHeight, bBlockHeight),
    externalCredentials,
    internalCredentials,
  };
}
