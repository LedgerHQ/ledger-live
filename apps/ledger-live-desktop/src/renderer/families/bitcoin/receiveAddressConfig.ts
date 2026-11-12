import type { Account } from "@ledgerhq/types-live";
import type { ReceiveFamilyTraits, ReceiveNoticeId } from "@features/flow-receive";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import { isZcashCurrencyId } from "@ledgerhq/live-common/bridge/zcashRouting";
import type { ReceiveAddressConfigInput } from "../types";

const TAPROOT_PURPOSE = "m/86h/";

export default function receiveAddressConfig({
  descriptor,
  asset,
  featureFlags,
  legacyAccount,
}: ReceiveAddressConfigInput<Account>): Partial<ReceiveFamilyTraits> {
  const notices: ReceiveNoticeId[] = ["utxo"];
  if (descriptor.type === "utxo" && descriptor.path.startsWith(TAPROOT_PURPOSE)) {
    notices.push("taproot");
  }
  if (asset.id === "dash") notices.push("dashStaking");

  if (!featureFlags.zcashShielded?.enabled || !isZcashCurrencyId(asset.id)) return { notices };
  // The shielded address and the balances come from the `receive` account data.
  const privateInfo = (legacyAccount as ZcashAccount | undefined)?.privateInfo as
    | ZcashPrivateInfo
    | undefined;
  return privateInfo?.shieldedAddress
    ? { notices }
    : { notices: [...notices, "zcashPrivateNotEnabled"] };
}
