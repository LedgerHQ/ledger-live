import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import Btc from "@ledgerhq/hw-app-btc";
import { log } from "@ledgerhq/logs";
import {
  DerivationMode,
  isSegwitDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { encodeOperationId } from "./../../operation";
import { withDevice } from "../../hw/deviceAccess";
import type { Transaction } from "./types";
import { getNetworkParameters } from "./networks";
import { buildTransaction } from "./js-buildTransaction";
import { calculateFees } from "./cache";
import wallet, { getWalletAccount } from "./wallet-btc";
import { perCoinLogic } from "./logic";
import type {
  Account,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      async function main() {
        const { currency } = account;
        const hwApp = new Btc({ transport, currency: currency.id });
        const walletAccount = getWalletAccount(account);

        log("hw", `signTransaction ${currency.id} for account ${account.id}`);
        const txInfo = await buildTransaction(account, transaction);
        let senders = new Set<string>();
        let recipients: string[] = [];
        let fee = new BigNumber(0);
        // Maybe better not re-calculate these fields here, instead include them
        // in Transaction type and set them in prepareTransaction?
        await calculateFees({
          account,
          transaction,
        }).then((res) => {
          senders = new Set(res.txInputs.map((i) => i.address).filter(Boolean));
          recipients = res.txOutputs
            .filter((o) => o.address && !o.isChange)
            .map((o) => o.address) as string[];
          fee = res.fees;
        });

        let lockTime;

        // (legacy) Set lockTime for Komodo to enable reward claiming on UTXOs created by
        // Ledger Live. We should only set this if the currency is Komodo and
        // lockTime isn't already defined.
        if (currency.id === "komodo" && lockTime === undefined) {
          const unixtime = Math.floor(Date.now() / 1000);
          lockTime = unixtime - 777;
        }

        const networkParams = getNetworkParameters(currency.id);
        const sigHashType = networkParams.sigHash;
        if (isNaN(sigHashType)) {
          throw new Error("sigHashType should not be NaN");
        }

        const segwit = isSegwitDerivationMode(
          account.derivationMode as DerivationMode
        );

        const hasTimestamp = currency.id === "peercoin";
        const initialTimestamp = hasTimestamp
          ? Math.floor(Date.now() / 1000)
          : undefined;

        const perCoin = perCoinLogic[currency.id];
        let additionals: string[] = [currency.id];

        if (account.derivationMode === "native_segwit") {
          additionals.push("bech32");
        }

        if (account.derivationMode === "taproot") {
          additionals.push("bech32m");
        }

        if (perCoin?.getAdditionals) {
          additionals = additionals.concat(
            perCoin.getAdditionals({
              transaction,
            })
          );
        }

        const expiryHeight = perCoin?.hasExpiryHeight
          ? Buffer.from([0x00, 0x00, 0x00, 0x00])
          : undefined;

        const hasExtraData = perCoin?.hasExtraData || false;

        const signature = await wallet.signAccountTx({
          btc: hwApp,
          fromAccount: walletAccount,
          txInfo,
          lockTime,
          sigHashType,
          segwit,
          hasTimestamp,
          initialTimestamp,
          additionals,
          expiryHeight,
          hasExtraData,
          onDeviceSignatureGranted: () =>
            o.next({
              type: "device-signature-granted",
            }),
          onDeviceSignatureRequested: () =>
            o.next({
              type: "device-signature-requested",
            }),
          onDeviceStreaming: ({ progress, index, total }) =>
            o.next({
              type: "device-streaming",
              progress,
              index,
              total,
            }),
        });
        // Build the optimistic operation
        const operation: Operation = {
          id: encodeOperationId(account.id, "", "OUT"),
          hash: "", // Will be resolved in broadcast()
          type: "OUT",
          value: new BigNumber(transaction.amount).plus(fee),
          fee,
          blockHash: null,
          blockHeight: null,
          senders: Array.from(senders),
          recipients,
          accountId: account.id,
          date: new Date(),
          extra: {},
        };
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: null,
          },
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );
    })
  );

export default signOperation;
