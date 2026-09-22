export const ETH_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
export const ETH_DESCRIPTOR = `account:1:address:ethereum:main:${ETH_ADDRESS}:m/44h/60h/0h/0/0`;

// Ethereum m/44'/60'/0'/0/0 derived from the standard Hardhat/Foundry test mnemonic
// ("test test … junk") — a well-known constant in the Ethereum developer ecosystem.
export const MOCK_ETH_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const MOCK_ETH_PUBKEY = "038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75";
export const MOCK_ETH_DESCRIPTOR = `account:1:address:ethereum:main:${MOCK_ETH_ADDRESS}:m/44h/60h/0h/0/0`;

// Solana account — used for `earn` family-routing / error-path tests that never sync over HTTP
// (e.g. the missing --stake-account guard and the partial-amount rejection both throw early).
export const MOCK_SOL_ADDRESS = "7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X";
export const MOCK_SOL_DESCRIPTOR = `account:1:address:solana:main:${MOCK_SOL_ADDRESS}:m/44h/501h/0h/0h`;

// Bitcoin account — a non-evm/non-solana family used to exercise the "unsupported family" branch of
// `earn deposit` / `earn withdraw`, which throws in the command switch before any HTTP call.
export const MOCK_BTC_ADDRESS = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
export const MOCK_BTC_DESCRIPTOR = `account:1:address:bitcoin:main:${MOCK_BTC_ADDRESS}:m/84h/0h/0h/0/0`;
