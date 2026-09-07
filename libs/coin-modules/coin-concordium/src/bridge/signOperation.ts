import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Observable } from "rxjs";
import type { ConcordiumSigner, Transaction } from "../types";
import { combine, craftTransaction, estimateFees, getNextValidSequence } from "../logic";
import { getTransactionStatus } from "./getTransactionStatus";
import coinConfig from "../config";

export const buildSignOperation =
  (signerContext: SignerContext<ConcordiumSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        const status = await getTransactionStatus(account, transaction);
        const actualAmount = status.amount;

        o.next({
          type: "device-signature-requested",
        });

        const config = coinConfig.getCoinConfig(account.currency.id);
        const nextSequenceNumber = await getNextValidSequence(
          config,
          account.freshAddress,
          account.currency.id,
        );

        // The fee shown in the wallet and the energy in the signed header must
        // be two halves of one estimate, or the device's "Max fees" step
        // contradicts the figure the user already approved. The discriminator is
        // the selected sub-account, not a present `energy`: that field outlives
        // any token selection, so reading it alone would declare a token energy
        // limit on a native transfer.
        const isTokenTransfer =
          findSubAccountById(account, transaction.subAccountId ?? "")?.type === "TokenAccount";

        if (isTokenTransfer && transaction.energy === undefined) throw new FeeNotLoaded();

        const estimation =
          isTokenTransfer && transaction.energy !== undefined
            ? { cost: BigInt(fee.toString()), energy: BigInt(transaction.energy) }
            : await estimateFees(config, account.currency.id, transaction.memo);

        // `craftTransaction` emits a native transfer whatever it is handed, so a
        // token send would move CCD at the token's integer amount — the wrong
        // asset, at a magnitude the token's decimals chose. The api layer refuses
        // a PLT intent for this reason (`assertNativeAsset`); the bridge had no
        // equivalent. Removed by LIVE-28337, which crafts the `TokenUpdate`
        // payload.
        invariant(!isTokenTransfer, "concordium: signing a PLT transfer is not supported yet");

        const signature = await signerContext(deviceId, async signer => {
          const { freshAddressPath: derivationPath } = account;
          const publicKey = await signer.getPublicKey(derivationPath, false);

          const structuredTransaction = await craftTransaction(
            {
              address: account.freshAddress,
              publicKey,
              nextSequenceNumber,
            },
            {
              recipient: transaction.recipient,
              amount: actualAmount,
              fee: new BigNumber(estimation.cost.toString()),
              energy: estimation.energy,
              ...(transaction.memo ? { memo: transaction.memo } : {}),
            },
          );

          const result = await signer.signTransaction(
            structuredTransaction,
            derivationPath,
            estimation.cost,
          );

          return combine(result.serialized, [result.signature]);
        });

        o.next({
          type: "device-signature-granted",
        });

        const hash = "";
        const operation: Operation = {
          id: encodeOperationId(account.id, hash, "OUT"),
          hash,
          accountId: account.id,
          type: "OUT",
          value: actualAmount,
          fee: new BigNumber(estimation.cost.toString()),
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          date: new Date(),
          transactionSequenceNumber: new BigNumber(nextSequenceNumber.toString()),
          extra: {},
        };

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
        e => o.error(e),
      );
    });
