# `abis`
The contract Application Binary Interface (ABI) is the standard way to interact with smart contracts in the Ethereum ecosystem. This JSON file represents the various methods and properties of a smart contract and is essential for crafting the calldata necessary to interact with it.

## Files

#### erc20.abi.json
Defines the API for a fungible token (ERC20).
Full definition of the interface: https://docs.openzeppelin.com/contracts/4.x/api/token/erc20

#### erc721.abi.json
Defines the API for a non-fungible token (NFT) (ERC721).
Full definition of the interface: https://docs.openzeppelin.com/contracts/4.x/api/token/erc721

#### erc1155.abi.json
Defines the API for a semi-fungible token (NFT) (ERC1155).
Full definition of the interface: https://docs.openzeppelin.com/contracts/4.x/api/token/erc1155

#### optimismGasPriceOracle.abi.json
Specifies the API for the Optimism oracle smart contract dedicated to returning the pricing of transaction data availability on the L1 (Ethereum).
See documentation here: https://docs.optimism.io/builders/dapp-developers/transactions/estimates (section "Estimate the L1 data fee")