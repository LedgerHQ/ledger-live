import {
  Account,
  SignOperationFnSignature,
  SignOperationEvent,
  DeviceId,
} from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { ledgerService } from "@ledgerhq/hw-app-eth";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { LoadConfig, ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { EvmAddress, EvmSignature, EvmSigner } from "./types/signer";
import { prepareForSignOperation } from "./prepareTransaction";
import { getSerializedTransaction } from "./transaction";
import { Transaction } from "./types";

/**
 * Transforms the ECDSA signature paremeter v hexadecimal string received
 * from the nano into an EIP155 compatible number.
 *
 * Reminder EIP155 transforms v this way:
 * v = chainId * 2 + 35
 * (+ parity 1 or 0)
 */
export const applyEIP155 = (vAsHex: string, chainId: number): number => {
  const v = parseInt(vAsHex, 16);

  if (v === 0 || v === 1) {
    // if v is 0 or 1, it's already representing parity
    return chainId * 2 + 35 + v;
  } else if (v === 27 || v === 28) {
    const parity = v - 27; // transforming v into 0 or 1 to become the parity
    return chainId * 2 + 35 + parity;
  }
  // When chainId is lower than 109, hw-app-eth *can* return a v with EIP155 already applied
  // e.g. bsc's chainId is 56 -> v then equals to 147/148
  //      optimism's chainId is 10 -> v equals to 55/56
  //      ethereum's chainId is 1 -> v equals to 0/1
  //      goerli's chainId is 5 -> v equals to 0/1
  return v;
};

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
  ): SignOperationFnSignature<Transaction> =>
  ({
    account,
    deviceId,
    transaction,
  }: {
    account: Account;
    deviceId: DeviceId;
    transaction: Transaction;
  }): Observable<SignOperationEvent> =>
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
        };
        const loadConfig: LoadConfig = {
          cryptoassetsBaseURL: getEnv("DYNAMIC_CAL_BASE_URL"),
          nftExplorerBaseURL: getEnv("NFT_ETH_METADATA_SERVICE") + "/v1/ethereum",
        };
        // Look for resolutions for external plugins and ERC20
        const resolution = await ledgerService.resolveTransaction(
          serializedTxHexString,
          loadConfig,
          resolutionConfig,
        );

        o.next({
          type: "device-signature-requested",
        });

        const sig = (await signerContext(deviceId, signer => {
          signer.setLoadConfig(loadConfig);
          // Request signature on the nano
          return signer.signTransaction(
            account.freshAddressPath,
            serializedTxHexString,
            resolution,
          );
        })) as EvmSignature;

        o.next({ type: "device-signature-granted" }); // Signature is done

        const { chainId = 0 } = account.currency.ethereumLikeInfo || /* istanbul ignore next */ {};
        // Create a new serialized tx with the signature now
        const signature = await getSerializedTransaction(preparedTransaction, {
          r: "0x" + sig.r,
          s: "0x" + sig.s,
          v: applyEIP155(typeof sig.v === "number" ? sig.v.toString(16) : sig.v, chainId),
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
