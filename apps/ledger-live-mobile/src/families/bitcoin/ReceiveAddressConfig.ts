import type { Account } from "@ledgerhq/types-live";
import type { GetReceiveFamilyConfig, ReceiveNoticeId } from "@features/flow-receive";

const receiveAddressConfig: GetReceiveFamilyConfig<Account> = ({ asset, legacyAccount }) => {
  const notices: ReceiveNoticeId[] = ["utxo"];
  if (legacyAccount?.derivationMode === "taproot") notices.push("taproot");
  if (asset.id === "dash") notices.push("dashStaking");
  return { notices };
};

export default receiveAddressConfig;
