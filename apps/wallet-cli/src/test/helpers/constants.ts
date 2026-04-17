export const ETH_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
export const ETH_DESCRIPTOR = `account:1:address:ethereum:main:${ETH_ADDRESS}:m/44h/60h/0h/0/0`;

// Ethereum m/44'/60'/0'/0/0 derived from the standard Hardhat/Foundry test mnemonic
// ("test test … junk") — a well-known constant in the Ethereum developer ecosystem.
export const MOCK_ETH_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const MOCK_ETH_PUBKEY =
  "038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75";
export const MOCK_ETH_DESCRIPTOR = `account:1:address:ethereum:main:${MOCK_ETH_ADDRESS}:m/44h/60h/0h/0/0`;
