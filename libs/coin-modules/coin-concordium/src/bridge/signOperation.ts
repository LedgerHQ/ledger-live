import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import type { ConcordiumSigner, Transaction } from "../types";
import {
  ConcordiumInvalidPltPayloadError,
  ConcordiumTokenAccountUnavailable,
} from "../types/errors";
import {
  combine,
  craftPltTransaction,
  craftTransaction,
  estimateFees,
  getNextValidSequence,
} from "../logic";
import { getTransactionStatus } from "./getTransactionStatus";
import coinConfig from "../config";

export const buildSignOperation =
  (signerContext: SignerContext<ConcordiumSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        // `fromTransactionRaw` builds the fee with `new BigNumber(tr.fee)`, and a
        // `BigNumber` holding NaN is truthy — so falsiness alone would let it reach
        // `BigInt(fee.toString())` on the token path and throw a raw `SyntaxError`
        // after the device prompt had been requested.
        const { fee } = transaction;
        if (!fee || fee.isNaN()) throw new FeeNotLoaded();

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
        const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
        const tokenAccount = subAccount?.type === "TokenAccount" ? subAccount : undefined;

        // Fails closed: the alternative is a signed CCD transfer. Typed rather
        // than an invariant because a user can reach this, so it needs to reach
        // them translated.
        if (!tokenAccount && transaction.subAccountId) {
          throw new ConcordiumTokenAccountUnavailable(
            "concordium: transaction references a token sub-account that no longer exists",
          );
        }

        if (tokenAccount && transaction.energy === undefined) throw new FeeNotLoaded();

        // The chain compares the amount's exponent against the token's
        // registered decimals, so an absent magnitude cannot be defaulted. Status
        // blocks this case, but signing does not read `status.errors`, so the
        // check is repeated rather than assumed.
        const decimals = tokenAccount?.token.units[0]?.magnitude;
        if (tokenAccount && decimals === undefined) {
          throw new ConcordiumInvalidPltPayloadError("", { reason: "missing token magnitude" });
        }

        const estimation =
          tokenAccount && transaction.energy !== undefined
            ? { cost: BigInt(fee.toString()), energy: BigInt(transaction.energy) }
            : await estimateFees(config, account.currency.id, transaction.memo);

        const signature = await signerContext(deviceId, async signer => {
          const { freshAddressPath: derivationPath } = account;
          const publicKey = await signer.getPublicKey(derivationPath, false);

          const structuredTransaction =
            tokenAccount && decimals !== undefined
              ? craftPltTransaction(
                  {
                    address: account.freshAddress,
                    nextSequenceNumber,
                  },
                  {
                    tokenId: tokenAccount.token.contractAddress,
                    recipient: transaction.recipient,
                    amount: actualAmount,
                    decimals,
                    energy: estimation.energy,
                    ...(transaction.memo ? { memo: transaction.memo } : {}),
                  },
                )
              : await craftTransaction(
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
        const feeValue = new BigNumber(estimation.cost.toString());
        const shared = {
          hash,
          fee: feeValue,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          date: new Date(),
          transactionSequenceNumber: new BigNumber(nextSequenceNumber.toString()),
        };

        // Shaped to match the pair sync builds for a confirmed transfer — the
        // CCD fee on the parent, the token amount hanging under it — so this
        // optimistic pair is replaced rather than duplicated once indexed.
        const operation: Operation = tokenAccount
          ? {
              ...shared,
              id: encodeOperationId(account.id, hash, "FEES"),
              accountId: account.id,
              type: "FEES",
              value: feeValue,
              extra: {},
              subOperations: [
                {
                  ...shared,
                  id: encodeOperationId(tokenAccount.id, hash, "OUT"),
                  accountId: tokenAccount.id,
                  type: "OUT",
                  // The token amount alone: the fee is CCD and belongs to the
                  // parent, so folding it in would put µCCD into a token balance.
                  value: actualAmount,
                  extra: transaction.memo ? { memo: transaction.memo } : {},
                },
              ],
            }
          : {
              ...shared,
              id: encodeOperationId(account.id, hash, "OUT"),
              accountId: account.id,
              type: "OUT",
              value: actualAmount,
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
