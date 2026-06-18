const EVM_DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
// zkSync bans the dead address, so it gets a near-dead but accepted address.
const EVM_ZKSYNC_ADDRESS = "0x123000000000000000000000000000000000dEaD";

export const getEvmDummyAddress = (currencyId: string): string =>
  currencyId === "zksync" || currencyId === "zksync_sepolia"
    ? EVM_ZKSYNC_ADDRESS
    : EVM_DEAD_ADDRESS;
