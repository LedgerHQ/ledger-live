import invariant from "invariant";
import { Observable, from, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import eip55 from "eip55";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import Eth from "@ledgerhq/hw-app-eth";
import { byContractAddressAndChainId } from "@ledgerhq/hw-app-eth/erc20";
import type { Transaction } from "./types";
import type { Operation, Account, SignOperationEvent } from "../../types";
import { getGasLimit, buildEthereumTx } from "./transaction";
import { apiForCurrency } from "../../api/Ethereum";
import { withDevice } from "../../hw/deviceAccess";
import { modes } from "./modules";
import { getEnv } from "../../env";
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
              const { gasPrice } = transaction;
              const gasLimit = getGasLimit(transaction);

              if (!gasPrice || !new BigNumber(gasLimit).gt(0)) {
                log(
                  "ethereum-error",
                  "buildTransaction missingData: gasPrice=" +
                    String(gasPrice) +
                    " gasLimit=" +
                    String(gasLimit)
                );
                throw new FeeNotLoaded();
              }

              const { tx, fillTransactionDataResult } = buildEthereumTx(
                account,
                transaction,
                nonce
              );
              const to = eip55.encode("0x" + tx.to.toString("hex"));
              const chainId = tx.getChainId();
              const value = new BigNumber(
                "0x" + (tx.value.toString("hex") || "0")
              );
              const eth = new Eth(transport);
              if (getEnv("NFT")) {
                eth.setLoadConfig({
                  // FIXME drop this after LL-8001
                  nftExplorerBaseURL:
                    "https://nft.staging.aws.ledger.fr/v1/ethereum",
                });
              }
              // FIXME this part is still required for compound to correctly display info on the device
              const addrs =
                (fillTransactionDataResult &&
                  fillTransactionDataResult.erc20contracts) ||
                [];

              for (const addr of addrs) {
                const tokenInfo = byContractAddressAndChainId(
                  addr,
                  account.currency.ethereumLikeInfo?.chainId || 0
                );

                if (tokenInfo) {
                  await eth.provideERC20TokenInformation(tokenInfo);
                  if (cancelled) return;
                }
              }

              o.next({
                type: "device-signature-requested",
              });
              const result = await eth.signTransaction(
                freshAddressPath,
                tx.serialize().toString("hex")
              );
              if (cancelled) return;
              o.next({
                type: "device-signature-granted",
              });
              // Second, we re-set some tx fields from the device signature
              const v = result.v;

              tx.v = Buffer.from(v, "hex");
              tx.r = Buffer.from(result.r, "hex");
              tx.s = Buffer.from(result.s, "hex");
              // Generate the signature ready to be broadcasted
              const signature = `0x${tx.serialize().toString("hex")}`;
              // build optimistic operation
              const txHash = ""; // resolved at broadcast time

              const senders = [freshAddress];
              const recipients = [to];
              const fee = gasPrice.times(gasLimit);
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
              };
              const m = modes[transaction.mode];
              invariant(m, "missing module for mode=" + transaction.mode);
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
