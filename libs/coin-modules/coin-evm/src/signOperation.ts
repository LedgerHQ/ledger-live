import { Observable } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { AccountBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import type { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { EvmSignature, EvmSigner } from "./types/signer";
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
      async function main(): Promise<void> {
        const preparedTransaction = await prepareForSignOperation({
          account,
          transaction,
        });
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
          nftExplorerBaseURL: getEnv("NFT_ETH_METADATA_SERVICE") + "/v1/ethereum",
        };

        o.next({
          type: "device-signature-requested",
        });

        const sig = (await signerContext(deviceId, signer => {
          signer.setLoadConfig(loadConfig);
          // Request signature on the nano
          return signer.clearSignTransaction(
            account.freshAddressPath,
            serializedTxHexString,
            resolutionConfig,
            true,
          );
        })) as EvmSignature;

        o.next({ type: "device-signature-granted" }); // Signature is done

        // Create a new serialized tx with the signature now
        const signature = await getSerializedTransaction(preparedTransaction, {
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
      }

      main().then(
        () => o.complete(),
        /* istanbul ignore next: don't test throwing an error */
        e => o.error(e),
      );
    });
