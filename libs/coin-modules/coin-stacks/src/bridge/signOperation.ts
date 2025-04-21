import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { FeeNotLoaded, InvalidAddress, InvalidNonce } from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  UnsignedTokenTransferOptions,
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  uintCV,
  standardPrincipalCV,
  someCV,
  stringAsciiCV,
  noneCV,
} from "@stacks/transactions";
import invariant from "invariant";
import { Observable } from "rxjs";
import { StacksNetwork } from "../network/api.types";
import { StacksSigner, Transaction } from "../types";
import { getPath, throwIfError } from "../utils";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";

export const buildSignOperation =
  (signerContext: SignerContext<StacksSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { derivationPath } = getAddress(account);
        const { xpub } = account;
        invariant(xpub, "xpub is required");

        const { recipient, fee, anchorMode, network, memo, amount, nonce } = transaction;

        if (!xpub) {
          throw new InvalidAddress("", {
            currencyName: account.currency.name,
          });
        }

        if (!fee) {
          throw new FeeNotLoaded();
        }

        if (!nonce) {
          throw new InvalidNonce();
        }

        // Check if this is a token transaction
        const subAccount = getSubAccount(account, transaction);
        const tokenAccountTxn = !!subAccount;

        let serializedTx: Buffer;
        if (tokenAccountTxn) {
          // Token transfer transaction
          const contractAddress = subAccount?.token.contractAddress;
          const contractName = subAccount?.token.id.split("/").pop() ?? "";

          // Create the function arguments for the SIP-010 transfer function
          const functionArgs = [
            uintCV(amount.toString()), // Amount
            standardPrincipalCV(recipient), // Recipient
            memo ? someCV(stringAsciiCV(memo)) : noneCV(), // Memo (optional)
          ];

          const tx = await makeUnsignedContractCall({
            contractAddress,
            contractName,
            functionName: "transfer",
            functionArgs,
            anchorMode,
            network: StacksNetwork[network],
            publicKey: xpub,
            fee: fee.toFixed(),
            nonce: nonce.toFixed(),
          });

          serializedTx = Buffer.from(tx.serialize());
        } else {
          // Regular STX transfer
          const options: UnsignedTokenTransferOptions = {
            amount: amount.toFixed(),
            recipient,
            anchorMode,
            network: StacksNetwork[network],
            memo,
            publicKey: xpub,
            fee: fee.toFixed(),
            nonce: nonce.toFixed(),
          };

          const tx = await makeUnsignedSTXTokenTransfer(options);
          serializedTx = Buffer.from(tx.serialize());
        }

        o.next({
          type: "device-signature-requested",
        });

        // Sign by device
        const result = await signerContext(deviceId, async signer => {
          return signer.sign(getPath(derivationPath), serializedTx);
        });

        throwIfError(result);

        o.next({
          type: "device-signature-granted",
        });

        // build signature on the correct format
        const signature = `${result.signatureVRS.toString("hex")}`;

        const operation = buildOptimisticOperation(account, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            rawData: {
              xpub,
              network,
              anchorMode,
              tokenTransfer: tokenAccountTxn,
              // Add token contract details if needed
              ...(tokenAccountTxn && {
                contractAddress: subAccount.token.contractAddress,
                contractName: (subAccount.token as any).contractName || "",
              }),
            },
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
