import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { FeeNotLoaded, InvalidAddress, InvalidNonce } from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { UnsignedTokenTransferOptions, makeUnsignedSTXTokenTransfer } from "@stacks/transactions";
import invariant from "invariant";
import { Observable } from "rxjs";
import { StacksNetwork } from "../network/api.types";
import { StacksSigner, Transaction } from "../types";
import { getPath, throwIfError } from "../utils";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { getAddress } from "./utils/misc";

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

        const serializedTx = tx.serialize();

        o.next({
          type: "device-signature-requested",
        });

        // Sign by device
        const result = await signerContext(deviceId, async signer => {
          return signer.sign(getPath(derivationPath), Buffer.from(serializedTx));
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
            },
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
