import type { GetReceiveFamilyConfig } from "@features/flow-receive";

const receiveAddressConfig: GetReceiveFamilyConfig = ({ asset }) => {
  const receivesNativeAsset = asset.type === "CryptoCurrency";
  return receivesNativeAsset ? { notices: ["utxo"] } : {};
};

export default receiveAddressConfig;
