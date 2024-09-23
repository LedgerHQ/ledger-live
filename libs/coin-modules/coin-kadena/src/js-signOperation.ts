import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Observable } from "rxjs";
import { fetchCoinDetailsForAccount } from "./api/network";
import { KDA_FEES_BASE, KDA_GAS_LIMIT_TRANSFER, KDA_NETWORK } from "./constants";
import { TransferCrossChainTxParams, TransferTxParams } from "./hw-app-kda/Kadena";
import { KadenaSignature, KadenaSigner } from "./signer";
import { KadenaAccount, KadenaOperation, Transaction } from "./types";
import { getPath, kdaToBaseUnit } from "./utils";

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

        const { recipient, amount, gasLimit, gasPrice, receiverChainId, senderChainId } =
          transaction;
        const fees = gasPrice.multipliedBy(gasLimit);
        const { id: accountId, freshAddress: address } = account;

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
          gasLimit: KDA_GAS_LIMIT_TRANSFER.toFixed(),
          gasPrice: KDA_FEES_BASE,
          path: getPath(account.freshAddressPath),
          creationTime: Math.floor(creationTimeStamp / 1000),
          ttl: txnTTLSecs.toString(),
        };

        if (senderChainId === receiverChainId) {
          if (coinDetails[receiverChainId]) {
            buildTxnRes = (await signerContext(deviceId, signer =>
              signer.signTransferTx(getPath(account.freshAddressPath), transferCommons),
            )) as KadenaSignature;
          } else {
            buildTxnRes = (await signerContext(deviceId, signer =>
              signer.signTransferCreateTx(getPath(account.freshAddressPath), transferCommons),
            )) as KadenaSignature;
          }
        } else {
          buildTxnRes = (await signerContext(deviceId, signer =>
            signer.signTransferCrossChainTx(getPath(account.freshAddressPath), {
              ...transferCommons,
              recipient_chainId: receiverChainId,
            }),
          )) as KadenaSignature;
        }
        if (cancelled) return;

        invariant(buildTxnRes, "transferCmd is required");
        
        const { pact_command } = buildTxnRes;

        o.next({
          type: "device-signature-granted",
        });

        const operation: KadenaOperation = {
          id: encodeOperationId(accountId, pact_command.hash, "OUT"),
          hash: pact_command.hash,
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
            signature: pact_command.sigs[0].sig,
            expirationDate: new Date(creationTimeStamp + txnTTLSecs * 1000),
            rawData: {
              pact_command,
            },
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
