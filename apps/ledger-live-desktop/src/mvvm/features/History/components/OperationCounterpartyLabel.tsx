import React from "react";
import { getCurrencyForAccount } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAddressDisplay } from "LLD/hooks/useAddressDisplay";
import type { OperationTableItem } from "../types";

type OperationCounterpartyLabelProps = {
  readonly item: OperationTableItem;
  readonly prefix?: string;
};

export function OperationCounterpartyLabel({ item, prefix }: OperationCounterpartyLabelProps) {
  const { address, account, parentAccount } = item;
  const mainAccount = getMainAccount(account, parentAccount);
  const displayAddress = address || mainAccount.freshAddress;
  const cryptoOrToken = getCurrencyForAccount(account);
  const currencyId =
    cryptoOrToken.type === "TokenCurrency" ? cryptoOrToken.parentCurrencyId : cryptoOrToken.id;
  const { displayName } = useAddressDisplay(displayAddress, currencyId);

  if (!displayName) return null;

  return (
    <div className="inline-flex gap-4">
      {prefix && <span className="text-neutral-c80">{prefix}</span>}
      <span>{displayName}</span>
    </div>
  );
}
