import React, { useEffect } from "react";
import { isZcashCurrencyId } from "@ledgerhq/live-common/bridge/zcashRouting";
import { useZcashShieldedSync } from "./useZcashShieldedSync";
import ZcashSyncStateBanner from "./ZcashSyncStateBanner";
import type { ZcashFamily } from "./types";

type Props = NonNullable<ZcashFamily["sendAmountFields"]>["component"];

// Zcash prices fees with ZIP-317 (deterministic, action-based): there is no sat/vByte fee
// market, so there is no fee selector. The ZIP-317 fee is applied automatically
// (see getAccountNetworkInfo).
const Fields: Props = ({ transaction, account }) => {
  const isZcash = isZcashCurrencyId(account.currency.id);
  const { startShieldedSync } = useZcashShieldedSync(account);

  useEffect(() => {
    if (isZcash && transaction.sender === "private") startShieldedSync();
    // Re-fire only when the source account or the chosen pool changes, not on
    // every amount keystroke.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, transaction.sender]);

  return isZcash && transaction.sender === "private" ? (
    <ZcashSyncStateBanner account={account} sender={transaction.sender} />
  ) : null;
};

export default {
  component: Fields,
  fields: ["feePerByte", "rbf"],
};
