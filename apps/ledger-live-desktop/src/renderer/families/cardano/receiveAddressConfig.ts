import type { GetReceiveFamilyConfig } from "@features/flow-receive";

export const receiveAddressConfig: GetReceiveFamilyConfig = () => ({ notices: ["utxo"] });
