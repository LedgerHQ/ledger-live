import {
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
  Transaction as LegacyEthereumTx,
} from "@ethereumjs/tx";
import eip55 from "eip55";
import { encode } from "rlp";
import type {
  Operation,
  Account,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import Eth from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { mergeMap } from "rxjs/operators";
import { Observable, from, of } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { ledgerService as ethLedgerServices } from "@ledgerhq/hw-app-eth";
import { apiForCurrency } from "../../api/Ethereum";
import { withDevice } from "../../hw/deviceAccess";
import type { Transaction } from "./types";
import { isNFTActive } from "../../nft";
import { getEnv } from "../../env";
import { modes } from "./modules";
import {
  getGasLimit,
  buildEthereumTx,
  EIP1559ShouldBeUsed,
  toTransactionRaw,
} from "./transaction";
import { padHexString } from "./logic";

export const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  from(
    transaction.nonce !== undefined
      ? of(transaction.nonce)
      : apiForCurrency(account.currency).getAccountNonce(account.freshAddress)
  ).pipe(
    mergeMap((nonce) =>
      withDevice(deviceId)(
        (transport) =>
          new Observable<SignOperationEvent>((o) => {
            let cancelled;

            async function main() {
              // First, we need to create a partial tx and send to the device
              const { freshAddressPath, freshAddress } = account;
              const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } =
                transaction;
              const gasLimit = getGasLimit(transaction);

              let dataMissing = !new BigNumber(gasLimit).gt(0);
              let missingDataString = "";
              if (EIP1559ShouldBeUsed(account.currency)) {
                missingDataString = ` maxFeePerGas=${String(
                  maxFeePerGas
                )} maxPriorityFeePerGas=${String(maxPriorityFeePerGas)}`;
                dataMissing =
                  dataMissing && (!maxFeePerGas || !maxPriorityFeePerGas);
              } else {
                missingDataString = ` gasPrice=${String(gasPrice)}`;
                dataMissing = dataMissing && !gasPrice;
              }
              if (dataMissing) {
                log(
                  "ethereum-error",
                  `buildTransaction missingData: ${missingDataString} gasLimit=${String(
                    gasLimit
                  )}`
                );
                throw new FeeNotLoaded();
              }

              const { ethTxObject, tx, common } = buildEthereumTx(
                account,
                transaction,
                nonce
              );
              const to = eip55.encode((tx.to || "").toString());
              const value = new BigNumber(
                "0x" + (tx.value.toString("hex") || "0")
              );

              // rawData Format: type 0 `rlp([nonce, gasPrice, gasLimit, to, value, data, v, r, s])`
              // EIP1559 Format: type 2 || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, destination, amount, data, access_list, v, r, s])
              const txHex = (() => {
                if (EIP1559ShouldBeUsed(account.currency)) {
                  return tx.getMessageToSign(false).toString("hex");
                }

                const rawData = tx.raw();
                rawData[6] = Buffer.from(
                  padHexString(common.chainIdBN().toString("hex")),
                  "hex"
                );

                return Buffer.from(encode(rawData)).toString("hex");
              })();

              const loadConfig: LoadConfig = {
                cryptoassetsBaseURL: getEnv("DYNAMIC_CAL_BASE_URL"),
              };
              if (isNFTActive(account.currency)) {
                loadConfig.nftExplorerBaseURL =
                  getEnv("NFT_ETH_METADATA_SERVICE") + "/v1/ethereum";
              }

              const m = modes[transaction.mode];
              invariant(m, "missing module for mode=" + transaction.mode);

              const resolutionConfig = m.getResolutionConfig
                ? m.getResolutionConfig(account, transaction)
                : {};

              if (transaction.recipientDomain?.type === "forward") {
                resolutionConfig.domains = [transaction.recipientDomain];
              }

              log("rawtx", txHex);

              const resolution = await ethLedgerServices.resolveTransaction(
                txHex,
                loadConfig,
                resolutionConfig
              );

              const eth = new Eth(transport);
              eth.setLoadConfig(loadConfig);

              o.next({ type: "device-signature-requested" });
              const result = await eth.signTransaction(
                freshAddressPath,
                txHex,
                resolution
              );
              if (cancelled) return;
              o.next({ type: "device-signature-granted" });
              // Second, we re-set some tx fields from the device signature
              const v = `0x${result.v}`;
              const r = `0x${result.r}`;
              const s = `0x${result.s}`;

              const signedTx = (() => {
                if (EIP1559ShouldBeUsed(account.currency)) {
                  return new FeeMarketEIP1559Transaction(
                    { ...ethTxObject, v, r, s } as FeeMarketEIP1559TxData,
                    { common }
                  );
                }

                return new LegacyEthereumTx(
                  { ...ethTxObject, v, r, s },
                  { common }
                );
              })();
              // Generate the signature ready to be broadcasted
              const signature = `0x${signedTx.serialize().toString("hex")}`;

              // build optimistic operation
              const txHash = ""; // resolved at broadcast time

              const senders = [freshAddress];
              const recipients = [to];

              const fee = (() => {
                if (EIP1559ShouldBeUsed(account.currency)) {
                  return maxFeePerGas!
                    .plus(maxPriorityFeePerGas!)
                    .times(gasLimit);
                }
                return gasPrice!.times(gasLimit);
              })();

              const transactionSequenceNumber = nonce;
              const accountId = account.id;
              // currently, all mode are always at least one OUT tx on ETH parent
              const operation: Operation = {
                id: `${accountId}-${txHash}-OUT`,
                hash: txHash,
                transactionSequenceNumber: transactionSequenceNumber as
                  | number
                  | undefined,
                type: "OUT",
                value: new BigNumber(value),
                fee,
                blockHash: null,
                blockHeight: null,
                senders,
                recipients,
                accountId,
                date: new Date(),
                extra: {},
                transactionRaw: toTransactionRaw(transaction),
              };
              m.fillOptimisticOperation(account, transaction, operation);
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
            return () => {
              cancelled = true;
            };
          })
      )
    )
  );
