import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { addPrefixToken, extractTokenId } from "@ledgerhq/coin-algorand/tokens";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountLike } from "@ledgerhq/types-live";
import type { AlgorandGenericTransaction, TransactionStatus } from "./types";

const displayTokenValue = (token: TokenCurrency) => `${token.name} (#${extractTokenId(token.id)})`;

const getSendFields = (
  { estimatedFees, amount }: TransactionStatus,
  account: AccountLike,
): Array<DeviceTransactionField> => {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Type",
    value: account.type === "TokenAccount" ? "Asset xfer" : "Payment",
  });

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({ type: "fees", label: "Fee" });
  }

  if (account.type === "TokenAccount") {
    fields.push({ type: "text", label: "Asset ID", value: displayTokenValue(account.token) });
  }

  if (amount) {
    fields.push({
      label: account.type === "TokenAccount" ? "Asset amt" : "Amount",
      type: "amount",
      value: formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  return fields;
};

const getOptInFields = async (
  { assetReference }: AlgorandGenericTransaction,
  { estimatedFees }: TransactionStatus,
): Promise<Array<DeviceTransactionField>> => {
  const fields: Array<DeviceTransactionField> = [
    { type: "text", label: "Type", value: "Asset xfer" },
  ];

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({ type: "fees", label: "Fee" });
  }

  if (assetReference) {
    const token = await getCryptoAssetsStore().findTokenById(addPrefixToken(assetReference));
    fields.push({
      type: "text",
      label: "Asset ID",
      value: token ? displayTokenValue(token) : `#${assetReference}`,
    });
  }

  fields.push({ type: "text", label: "Asset amt", value: "0" });

  return fields;
};

async function getDeviceTransactionConfig({
  account,
  transaction,
  status,
}: {
  account: AccountLike;
  transaction: AlgorandGenericTransaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  switch (transaction.mode) {
    case "send":
      return getSendFields(status, account);
    case "changeTrust":
      return getOptInFields(transaction, status);
    default:
      return [];
  }
}

export default getDeviceTransactionConfig;
