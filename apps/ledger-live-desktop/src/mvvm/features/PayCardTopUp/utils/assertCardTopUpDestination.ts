const EVM_ADDRESS = /^0x[0-9a-f]{40}$/i;

export function assertCardTopUpDestination(
  linkedWalletAddress: string,
  payinAddress: string,
): void {
  const matches =
    EVM_ADDRESS.test(linkedWalletAddress) && EVM_ADDRESS.test(payinAddress)
      ? linkedWalletAddress.toLowerCase() === payinAddress.toLowerCase()
      : linkedWalletAddress === payinAddress;

  if (!matches) {
    throw new Error("The Fund payload does not target the selected card wallet");
  }
}
