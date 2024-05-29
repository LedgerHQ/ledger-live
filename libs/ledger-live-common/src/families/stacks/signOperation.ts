import { Observable } from "rxjs";
import invariant from "invariant";
import BlockstackApp from "@zondax/ledger-stacks";
import { AccountBridge } from "@ledgerhq/types-live";
import { FeeNotLoaded, InvalidAddress, InvalidNonce } from "@ledgerhq/errors";
import { UnsignedTokenTransferOptions, makeUnsignedSTXTokenTransfer } from "@stacks/transactions";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { StacksNetwork } from "./bridge/utils/api.types";
import { withDevice } from "../../hw/deviceAccess";
import { getAddress } from "./bridge/utils/misc";
import { getPath, throwIfError } from "./utils";
import { Transaction } from "./types";

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
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

          const blockstack = new BlockstackApp(transport);

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
          const result = await blockstack.sign(getPath(derivationPath), Buffer.from(serializedTx));
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
      }),
  );
