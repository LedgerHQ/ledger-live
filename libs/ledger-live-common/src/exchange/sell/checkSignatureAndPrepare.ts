import Transport from "@ledgerhq/hw-transport";
import { TransportStatusError } from "@ledgerhq/hw-transport";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
import invariant from "invariant";
import Exchange, { ExchangeTypes } from "@ledgerhq/hw-app-exchange";
import { getAccountCurrency, getMainAccount } from "../../account";
import { getCurrencyExchangeConfig } from "../";
import perFamily from "../../generated/exchange";
import type { SellRequestEvent } from "./types";
import type { Transaction, TransactionStatus } from "../../generated/types";
import { getProvider } from "./index";
import { delay } from "../../promise";
import type { Account, AccountLike } from "@ledgerhq/types-live";

type SellInput = {
  parentAccount: Account | null | undefined;
  account: AccountLike;
  transaction: Transaction;
  status: TransactionStatus;
  binaryPayload: string;
  payloadSignature: string;
};

export default async (
  transport: Transport,
  input: SellInput
): Promise<SellRequestEvent> => {
  const {
    binaryPayload,
    account,
    parentAccount,
    status,
    payloadSignature,
    transaction,
  } = input;
  const exchange = new Exchange(transport, ExchangeTypes.Sell);
  const mainAccount = getMainAccount(account, parentAccount);
  const { estimatedFees } = status;
  const provider = getProvider("coinify"); // FIXME Don't forget to switch to prod

  await exchange.setPartnerKey(provider.nameAndPubkey);
  await exchange.checkPartner(provider.signature);
  await exchange.processTransaction(
    Buffer.from(binaryPayload, "ascii"),
    estimatedFees
  );
  await exchange.checkTransactionSignature(
    Buffer.from(payloadSignature, "base64")
  );
  const mainPayoutCurrency = getAccountCurrency(mainAccount);
  const payoutCurrency = getAccountCurrency(account);
  invariant(
    mainPayoutCurrency.type === "CryptoCurrency",
    "This should be a cryptocurrency"
  );
  // FIXME: invariant not triggering typescriptp type guard
  if (mainPayoutCurrency.type !== "CryptoCurrency") {
    throw new Error("This should be a cryptocurrency");
  }
  const payoutAddressParameters = await perFamily[
    mainPayoutCurrency.family
  ].getSerializedAddressParameters(
    mainAccount.freshAddressPath,
    mainAccount.derivationMode,
    mainAccount.id
  );
  const {
    config: payoutAddressConfig,
    signature: payoutAddressConfigSignature,
  } = getCurrencyExchangeConfig(payoutCurrency);

  try {
    await exchange.checkPayoutAddress(
      payoutAddressConfig,
      payoutAddressConfigSignature,
      payoutAddressParameters.addressParameters
    );
  } catch (e) {
    // @ts-expect-error TransportStatusError to be typed on ledgerjs
    if (e instanceof TransportStatusError && e.statusCode === 0x6a83) {
      throw new WrongDeviceForAccount(undefined, {
        accountName: mainAccount.name,
      });
    }

    throw e;
  }

  await exchange.signCoinTransaction();
  await delay(3000);
  return {
    type: "init-sell-result",
    initSellResult: {
      transaction,
    },
  };
};
