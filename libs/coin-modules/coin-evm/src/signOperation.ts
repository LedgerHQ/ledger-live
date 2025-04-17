import { from, Observable, switchMap, tap, finalize } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { AccountBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import type { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { EvmSigner } from "./types/signer";
import { prepareForSignOperation } from "./prepareTransaction";
import { getSerializedTransaction } from "./transaction";
import { Transaction } from "./types";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<EvmSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      from(prepareForSignOperation({ account, transaction }))
        .pipe(
          switchMap(preparedTransaction => {
            const serializedTxHexString = getSerializedTransaction(preparedTransaction).slice(2); // Remove 0x prefix

            // Configure type of resolutions necessary for the clear signing
            const resolutionConfig: ResolutionConfig = {
              externalPlugins: true,
              erc20: true,
              nft: isNFTActive(account.currency),
              domains: transaction.recipientDomain ? [transaction.recipientDomain] : [],
              uniswapV3: true,
            };
            const loadConfig: LoadConfig = {
              cryptoassetsBaseURL: getEnv("DYNAMIC_CAL_BASE_URL"),
              nftExplorerBaseURL: getEnv("NFT_METADATA_SERVICE") + "/v1/ethereum",
            };

            return signerContext(deviceId, async signer => {
              signer.setLoadConfig(loadConfig);

              return new Promise<void>((resolve, reject) => {
                signer
                  .clearSignTransaction(
                    account.freshAddressPath,
                    serializedTxHexString,
                    resolutionConfig,
                    true,
                  )
                  .pipe(
                    tap(event => {
                      if (event.type === "signer.evm.transaction-checks-opt-in-triggered") {
                        o.next({ type: "transaction-checks-opt-in-triggered" });
                      }
                      if (event.type === "signer.evm.signing") {
                        o.next({ type: "device-signature-requested" });
                      }
                      if (event.type === "signer.evm.signed") {
                        o.next({ type: "device-signature-granted" });

                        const sig = event.value;
                        const signature = getSerializedTransaction(preparedTransaction, {
                          r: "0x" + sig.r,
                          s: "0x" + sig.s,
                          v: typeof sig.v === "number" ? sig.v : parseInt(sig.v, 16),
                        });

                        const operation = buildOptimisticOperation(account, {
                          ...transaction,
                          nonce: preparedTransaction.nonce,
                        });

                        o.next({
                          type: "signed",
                          signedOperation: {
                            operation,
                            signature,
                          },
                        });

                        o.complete();
                      }
                    }),
                    finalize(() => resolve()),
                  )
                  .subscribe({
                    error: error => {
                      reject(error);
                    },
                  });
              });
            });
          }),
        )
        .subscribe({
          error: error => {
            o.error(error);
          },
        });
    });
