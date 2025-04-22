import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { FeeNotLoaded, InvalidAddress, InvalidNonce } from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import { Observable } from "rxjs";
import { StacksSigner, Transaction } from "../types";
import { getPath, throwIfError } from "../utils";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { getAddress } from "./utils/misc";
import { getSubAccount } from "./utils/token";
import { createTransaction, getTokenContractDetails } from "./utils/transactions";

export const buildSignOperation =
  (signerContext: SignerContext<StacksSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { derivationPath, address } = getAddress(account);
        const { xpub } = account;
        invariant(xpub, "xpub is required");

        const { fee, anchorMode, network, nonce } = transaction;

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
        const tokenDetails = getTokenContractDetails(subAccount);

        // Create transaction
        const tx = await createTransaction(transaction, address, xpub, subAccount, fee, nonce);

        o.next({
          type: "device-signature-requested",
        });

        // Sign by device
        const result = await signerContext(deviceId, async signer => {
          return signer.sign(getPath(derivationPath), Buffer.from(tx.serialize()));
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
              // Add token contract details if needed
              ...(tokenDetails && {
                contractAddress: tokenDetails.contractAddress,
                contractName: tokenDetails.contractName,
                assetName: tokenDetails.assetName,
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
