import { Observable } from "rxjs";
import Eth, { ledgerService } from "@ledgerhq/hw-app-eth";
import {
  Account,
  SignOperationFnSignature,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import { ResolutionConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { prepareForSignOperation } from "./prepareTransaction";
import { getSerializedTransaction } from "./transaction";
import { Transaction as EvmTransaction } from "./types";
import {
  DeviceCommunication,
  KeyringInjection,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { EthKeyring } from "./keyrings/EthKeyring";
import LedgerEthKeyring, {
  LedgerEthKeyringConfig,
} from "./keyrings/LedgerEthKeyring";
import MetaMaskKeyring, {
  MetaMaskKeyringConfig,
} from "./keyrings/MetamaskKeyring";
import Transport from "@ledgerhq/hw-transport";
import { transactionToEthersTransaction } from "./adapters";

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

type KeyringConfig = LedgerEthKeyringConfig | MetaMaskKeyringConfig;

const keyringFactory = (
  keyringConfig: KeyringConfig,
  transport?: Transport
): EthKeyring => {
  switch (keyringConfig.name) {
    case "LedgerEthKeyring":
      if (!transport) throw new Error();
      return new LedgerEthKeyring(
        transport,
        keyringConfig.derivationPath,
        keyringConfig.clearSigningOptions
      );
    case "MetaMaskKeyring":
      return new MetaMaskKeyring(keyringConfig.connectorPort);
  }
};

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    withDeviceOrKeyring: DeviceCommunication | KeyringInjection
  ): SignOperationFnSignature<EvmTransaction, KeyringConfig> =>
  ({
    account,
    deviceId,
    keyringConfig,
    transaction,
  }: {
    account: Account;
    deviceId: any;
    keyringConfig?: KeyringConfig;
    transaction: EvmTransaction;
  }): Observable<SignOperationEvent> =>
    withDeviceOrKeyring<SignOperationEvent>(deviceId)(
      (transport: Transport | undefined) =>
        new Observable((o) => {
          async function keyringHandler(keyring: EthKeyring) {
            const preparedTransaction = await prepareForSignOperation(
              account,
              transaction
            );
            const ethersTransaction =
              transactionToEthersTransaction(preparedTransaction);

            o.next({
              type: "device-signature-requested",
            });
            const response = await keyring.signTransaction(ethersTransaction);

            o.next({ type: "device-signature-granted" }); // Signature is done

            if (typeof response === "string") {
              const optimisticOperation = buildOptimisticOperation(account, {
                ...transaction,
                nonce: preparedTransaction.nonce,
              });

              o.next({
                type: "broadcasted",
                optimisticOperation,
              });
            } else {
              const { chainId = 0 } = account.currency.ethereumLikeInfo || {};
              // Create a new serialized tx with the signature now
              const signature = await getSerializedTransaction(
                preparedTransaction,
                {
                  r: "0x" + response.r,
                  s: "0x" + response.s,
                  v: applyEIP155(response.v, chainId),
                }
              );

              const operation = buildOptimisticOperation(account, {
                ...transaction,
                nonce: preparedTransaction.nonce,
              });

              o.next({
                type: "signed",
                signedOperation: {
                  operation,
                  signature,
                  expirationDate: null,
                },
              });
            }
          }

          async function deviceHandler(transport: Transport) {
            const preparedTransaction = await prepareForSignOperation(
              account,
              transaction
            );
            const serializedTxHexString =
              getSerializedTransaction(preparedTransaction).slice(2); // Remove 0x prefix

            // Configure type of resolutions necessary for the clear signing
            const resolutionConfig: ResolutionConfig = {
              externalPlugins: true,
              erc20: true,
              domains: transaction.recipientDomain
                ? [transaction.recipientDomain]
                : [],
            };
            // Look for resolutions for external plugins and ERC20
            const resolution = await ledgerService.resolveTransaction(
              serializedTxHexString,
              {},
              resolutionConfig
            );

            o.next({
              type: "device-signature-requested",
            });

            // Instanciate Eth app bindings
            const eth = new Eth(transport);
            // Request signature on the nano
            const sig = await eth.signTransaction(
              account.freshAddressPath,
              serializedTxHexString,
              resolution
            );

            o.next({ type: "device-signature-granted" }); // Signature is done

            const { chainId = 0 } = account.currency.ethereumLikeInfo || {};
            // Create a new serialized tx with the signature now
            const signature = await getSerializedTransaction(
              preparedTransaction,
              {
                r: "0x" + sig.r,
                s: "0x" + sig.s,
                v: applyEIP155(sig.v, chainId),
              }
            );

            const operation = buildOptimisticOperation(account, {
              ...transaction,
              nonce: preparedTransaction.nonce,
            });

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
                expirationDate: null,
              },
            });
          }

          async function main() {
            if (transport && !keyringConfig) {
              return deviceHandler(transport);
            }
            const keyring = keyringFactory(keyringConfig!, transport);
            return keyringHandler(keyring);
          }

          main().then(
            () => o.complete(),
            (e) => o.error(e)
          );
        })
    );

// const account = {
//   ...{},
//   signersConfig: [
//     {
//       type: "LedgerEthKeyring",
//       derivationPath: "m/44'/0'/0'/0",
//       transport: "webusb",
//     },
//   ],
// };
