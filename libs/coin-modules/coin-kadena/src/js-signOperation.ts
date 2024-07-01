import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TransferCrossChainTxParams, TransferTxParams } from "./hw-app-kda/Kadena";
import invariant from "invariant";
import { Observable } from "rxjs";
import { fetchCoinDetailsForAccount } from "./api/network";
import { KDA_NETWORK } from "./constants";
import { KadenaSignature, KadenaSigner } from "./signer";
import { KadenaOperation, Transaction, KadenaAccount } from "./types";
import { getAddress, kdaToBaseUnit } from "./utils";

export const buildSignOperation =
  (
    signerContext: SignerContext<KadenaSigner>,
  ): SignOperationFnSignature<Transaction, KadenaAccount> =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      let cancelled = false;

      async function main() {
        // log("debug", "[signOperation] start fn");

        const { recipient, amount, gasLimit, gasPrice, receiverChainId, senderChainId } = transaction;
        const fees = gasPrice.multipliedBy(gasLimit);
        const { id: accountId } = account;
        const { address, derivationPath } = getAddress(account);

        const coinDetails = await fetchCoinDetailsForAccount(address, [receiverChainId.toString()]);

        o.next({
          type: "device-signature-requested",
        });

        let buildTxnRes: KadenaSignature;

        const creationTimeStamp = Date.now();
        const txnTTLSecs = 1200;
        const transferCommons: TransferTxParams | TransferCrossChainTxParams = {
          amount: kdaToBaseUnit(amount).toFixed(),
          chainId: senderChainId,
          network: KDA_NETWORK,
          recipient,
          path: derivationPath,
          creationTime: Math.floor(creationTimeStamp / 1000),
          ttl: txnTTLSecs.toString(),
        };
        if (senderChainId === receiverChainId) {
          if (coinDetails[receiverChainId]) {
            buildTxnRes = (await signerContext(deviceId, signer =>
              signer.signTransferTx(transferCommons),
            )) as KadenaSignature;
          } else {
            buildTxnRes = (await signerContext(deviceId, signer =>
              signer.signTransferCreateTx(transferCommons),
            )) as KadenaSignature;
          }
        } else {
          buildTxnRes = (await signerContext(deviceId, signer =>
            signer.signTransferCrossChainTx({
              ...transferCommons,
              recipient_chainId: receiverChainId,
            }),
          )) as KadenaSignature;
        }
        if (cancelled) return;

        invariant(buildTxnRes, "transferCmd is required");

        const { hash } = buildTxnRes.pact_command;

        o.next({
          type: "device-signature-granted",
        });

        const operation: KadenaOperation = {
          id: encodeOperationId(accountId, hash, "OUT"),
          hash,
          type: "OUT",
          senders: [address],
          recipients: [recipient],
          accountId,
          value: new BigNumber(amount),
          fee: new BigNumber(fees),
          blockHash: null,
          blockHeight: null,
          date: new Date(creationTimeStamp),
          extra: {
            receiverChainId,
            senderChainId,
          },
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: buildTxnRes.pact_command.sigs[0].sig,
            expirationDate: new Date(creationTimeStamp + txnTTLSecs * 1000),
            rawData: { pact_command: buildTxnRes.pact_command },
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignOperation;
