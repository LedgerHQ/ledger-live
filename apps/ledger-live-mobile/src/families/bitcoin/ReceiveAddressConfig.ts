import type { GetReceiveFamilyConfig, ReceiveNoticeId } from "@features/flow-receive";

const TAPROOT_PATH_PREFIX = "m/86h/";

const receiveAddressConfig: GetReceiveFamilyConfig = ({ descriptor, asset }) => {
  const notices: ReceiveNoticeId[] = ["utxo"];
  if (descriptor.path.startsWith(TAPROOT_PATH_PREFIX)) notices.push("taproot");
  if (asset.id === "dash") notices.push("dashStaking");
  return { notices };
};

export default receiveAddressConfig;
