// @flow

import { BigNumber } from "bignumber.js";
import { getWalletName } from "@ledgerhq/live-common/lib/account";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { InvalidAddress } from "@ledgerhq/live-common/lib/errors";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import {
  libcoreAmountToBigNumber,
  bigNumberToLibcoreAmount,
} from "./buildBigNumber";
import { isValidRecipient } from "./isValidRecipient";
import logger from "../logger";

export const getFeesForTransaction = withLibcoreF(
  core => async ({
    account,
    transaction,
  }: {
    account: Account,
    transaction: *,
  }): Promise<BigNumber> => {
    try {
      const { derivationMode, currency, xpub, index } = account;
      const walletName = getWalletName(account);

      const coreWallet = await getOrCreateWallet({
        core,
        walletName,
        currency,
        derivationMode,
      });

      const coreAccount = await getOrCreateAccount({
        core,
        coreWallet,
        index,
        xpub,
      });

      const bitcoinLikeAccount = await core.coreAccount.asBitcoinLikeAccount(
        coreAccount,
      );

      const walletCurrency = await core.coreWallet.getCurrency(coreWallet);

      const amount = await bigNumberToLibcoreAmount(
        core,
        walletCurrency,
        BigNumber(transaction.amount),
      );

      const feesPerByte = await bigNumberToLibcoreAmount(
        core,
        walletCurrency,
        BigNumber(transaction.feePerByte),
      );

      const isPartial = true;
      const transactionBuilder = await core.coreBitcoinLikeAccount.buildTransaction(
        bitcoinLikeAccount,
        isPartial,
      );

      const isValid = await isValidRecipient({
        currency: account.currency,
        recipient: transaction.recipient,
      });

      if (isValid !== null) {
        throw new InvalidAddress("", { currencyName: currency.name });
      }

      await core.coreBitcoinLikeTransactionBuilder.sendToAddress(
        transactionBuilder,
        amount,
        transaction.recipient,
      );

      await core.coreBitcoinLikeTransactionBuilder.pickInputs(
        transactionBuilder,
        0,
        0xffffff,
      );

      await core.coreBitcoinLikeTransactionBuilder.setFeesPerByte(
        transactionBuilder,
        feesPerByte,
      );

      const builded = await core.coreBitcoinLikeTransactionBuilder.build(
        transactionBuilder,
      );
      const feesAmount = await core.coreBitcoinLikeTransaction.getFees(builded);

      let fees = await libcoreAmountToBigNumber(core, feesAmount);
      if (fees.isLessThan(0)) {
        fees = BigNumber(0);
        logger.critical(new Error("fee is negative for " + currency.name));
      }
      return fees;
    } catch (error) {
      throw remapLibcoreErrors(error);
    }
  },
);
