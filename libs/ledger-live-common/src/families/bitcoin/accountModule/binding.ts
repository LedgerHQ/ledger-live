import { BigNumber } from "bignumber.js";
import {
  inputsOf,
  type UtxoAccountModuleApi,
  type UtxoCoinModuleApi,
} from "@ledgerhq/account-module-utxo";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/api";
import type { AccountModuleBinding } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { BitcoinDeviceSigner } from "../signer";
import type { BitcoinAccount, BitcoinOutput } from "../types";
import { getSerializedAddressParameters } from "./exchange";
import { accountOptions } from "./intent";
import { bitcoinAccountModule } from "./module";
import { decorateOptimisticOperation, isPendingSettled, mergeSentOperation } from "./pending";
import { readBitcoinState } from "./state";

async function getAccountKey(
  {
    currencyId,
    derivationPath,
    deviceId,
  }: { currencyId: string; derivationPath: string; deviceId: string | undefined },
  signerContext: SignerContext<BitcoinDeviceSigner>,
): Promise<string> {
  if (deviceId === undefined || deviceId === null) {
    throw new Error("deviceId required to generate the xpub");
  }
  const xpubVersion = getNetworkParameters(currencyId).xpubVersion.readUInt32BE(0);
  return signerContext(deviceId, signer =>
    signer.getWalletXpub({ currencyId, path: derivationPath, xpubVersion }),
  );
}

/**
 * The bitcoin family on the account layer (ADR-064 Option 1): its accounts are served by the
 * generic UTXO account module on coin-bitcoin. What stays here is Ledger Wallet's: the xpub read
 * on the device, the persisted resources, coin control, and how sends and replacements show.
 */
export const bitcoinAccountModuleBinding: AccountModuleBinding = {
  create: (api, currencyId) =>
    bitcoinAccountModule(api as unknown as UtxoCoinModuleApi, currencyId),
  getAccountKey,
  readState: readBitcoinState,
  accountFields: async ({ module, context, account }) => {
    const utxos = await (module as UtxoAccountModuleApi).getUTXOs(context, account);
    return {
      xpub: account.descriptor.key,
      bitcoinResources: {
        utxos: utxos.map((utxo): BitcoinOutput => ({
          hash: utxo.txid,
          outputIndex: utxo.vout,
          blockHeight: utxo.height,
          address: utxo.address,
          value: new BigNumber(utxo.value.toString()),
          rbf: utxo.replaceable,
          isChange: utxo.change,
        })),
        ...(account.state ? { accountState: account.state } : {}),
      },
    } as Partial<BitcoinAccount>;
  },
  accountOptions,
  toLiveOperation: (operation, live) => ({
    ...live,
    transactionSequenceNumber: live.transactionSequenceNumber ?? new BigNumber(0),
    extra: { inputs: inputsOf(operation) },
  }),
  isPendingSettled,
  mergeSentOperation,
  decorateOptimisticOperation,
  getSerializedAddressParameters,
};
