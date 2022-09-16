import invariant from "invariant";
import { Observable, from, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import eip55 from "eip55";
import { encode } from "rlp";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import Eth from "@ledgerhq/hw-app-eth";
import { byContractAddressAndChainId } from "@ledgerhq/hw-app-eth/erc20";
import { ledgerService as ethLedgerServices } from "@ledgerhq/hw-app-eth";
import type { Transaction } from "./types";
import type {
  Operation,
  Account,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import {
  getGasLimit,
  buildEthereumTx,
  EIP1559ShouldBeUsed,
} from "./transaction";
import { apiForCurrency } from "../../api/Ethereum";
import { withDevice } from "../../hw/deviceAccess";
import { modes } from "./modules";
import { isNFTActive } from "../../nft";
import { getEnv } from "../../env";
import type { LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import {
  FeeMarketEIP1559Transaction,
  Transaction as LegacyEthereumTx,
} from "@ethereumjs/tx";
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
              const { gasPrice, maxBaseFeePerGas, maxPriorityFeePerGas } =
                transaction;
              const gasLimit = getGasLimit(transaction);

              let dataMissing = !new BigNumber(gasLimit).gt(0);
              let missingDataString = "";
              if (EIP1559ShouldBeUsed(account.currency)) {
                missingDataString = ` maxBaseFeePerGas=${String(
                  maxBaseFeePerGas
                )} maxPriorityFeePerGas=${String(maxPriorityFeePerGas)}`;
                dataMissing =
                  dataMissing && (!maxBaseFeePerGas || !maxPriorityFeePerGas);
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

              const { ethTxObject, tx, common, fillTransactionDataResult } =
                buildEthereumTx(account, transaction, nonce);
              const to = eip55.encode((tx.to || "").toString());
              const value = new BigNumber(
                "0x" + (tx.value.toString("hex") || "0")
              );
              // rawData Format: `rlp([nonce, gasPrice, gasLimit, to, value, data, v, r, s])`
              // EIP1559 Format: 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, signature_y_parity, signature_r, signature_s])
              let txHex: string;
              if (EIP1559ShouldBeUsed(account.currency)) {
                const returnHashedMessage = false;
                txHex = tx
                  .getMessageToSign(returnHashedMessage)
                  .toString("hex");
              } else {
                const rawData = tx.raw();
                rawData[6] = Buffer.from([common.chainIdBN().toNumber()]);
                txHex = Buffer.from(encode(rawData)).toString("hex");
              }
              const loadConfig: LoadConfig = {};
              if (isNFTActive(account.currency)) {
                loadConfig.nftExplorerBaseURL =
                  getEnv("NFT_ETH_METADATA_SERVICE") + "/v1/ethereum";
              }

              const m = modes[transaction.mode];
              invariant(m, "missing module for mode=" + transaction.mode);

              const resolutionConfig = m.getResolutionConfig
                ? m.getResolutionConfig(account, transaction)
                : {};

              const resolution = await ethLedgerServices.resolveTransaction(
                txHex,
                loadConfig,
                resolutionConfig
              );

              const eth = new Eth(transport);
              eth.setLoadConfig(loadConfig);

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

              let signedTx: FeeMarketEIP1559Transaction | LegacyEthereumTx;
              if (EIP1559ShouldBeUsed(account.currency)) {
                signedTx = new FeeMarketEIP1559Transaction(
                  { ...ethTxObject, v, r, s },
                  { common }
                );
              } else {
                signedTx = new LegacyEthereumTx(
                  { ...ethTxObject, v, r, s },
                  { common }
                );
              }

              // Generate the signature ready to be broadcasted
              const signature = `0x${signedTx.serialize().toString("hex")}`;

              // build optimistic operation
              const txHash = ""; // resolved at broadcast time

              const senders = [freshAddress];
              const recipients = [to];
              let fee = new BigNumber(0);
              if (EIP1559ShouldBeUsed(account.currency)) {
                if (maxBaseFeePerGas && maxPriorityFeePerGas)
                  fee = maxBaseFeePerGas
                    .plus(maxPriorityFeePerGas)
                    .times(gasLimit);
              } else {
                if (gasPrice) fee = gasPrice.times(gasLimit);
              }
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
