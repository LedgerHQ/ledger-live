import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { EvmNftTransaction, Transaction as EvmTransaction } from "../../types";
import { makeAccount, makeTokenAccount } from "./common.fixtures";
import ERC1155ABI from "../../abis/erc1155.abi.json";
import ERC721ABI from "../../abis/erc721.abi.json";
import ERC20ABI from "../../abis/erc20.abi.json";
import { Account } from "@ledgerhq/types-live";

const currency = getCryptoCurrencyById("ethereum");
export const tokenAccount = makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin"));
export const account = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", currency, [
  tokenAccount,
]);
export const transaction: EvmTransaction = Object.freeze({
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  feesStrategy: "medium",
  family: "evm",
  mode: "send",
  gasPrice: new BigNumber(0),
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
});

export const tokenTransaction: EvmTransaction = Object.freeze({
  ...transaction,
  subAccountId: tokenAccount.id,
});

export const nftTransaction: EvmTransaction & EvmNftTransaction = Object.freeze({
  ...transaction,
  mode: "erc721",
  nft: {
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    tokenId: "1",
    quantity: new BigNumber(1),
    collectionName: "",
  },
});

export const expectedData = (
  account: Account,
  transaction: EvmTransaction,
  type: "erc20" | "erc721" | "erc1155",
): Buffer | undefined => {
  switch (type) {
    case "erc20":
      return Buffer.from(
        new ethers.utils.Interface(ERC20ABI)
          .encodeFunctionData("transfer", [transaction.recipient, transaction.amount.toFixed()])
          .slice(2),
        "hex",
      );
    case "erc721":
      return Buffer.from(
        new ethers.utils.Interface(ERC721ABI)
          .encodeFunctionData("safeTransferFrom(address,address,uint256,bytes)", [
            account.freshAddress,
            transaction.recipient,
            transaction.nft?.tokenId,
            "0x",
          ])
          .slice(2),
        "hex",
      );
    case "erc1155":
      return Buffer.from(
        new ethers.utils.Interface(ERC1155ABI)
          .encodeFunctionData("safeTransferFrom(address,address,uint256,uint256,bytes)", [
            account.freshAddress,
            transaction.recipient,
            transaction.nft?.tokenId,
            transaction.nft?.quantity?.toFixed(),
            "0x",
          ])
          .slice(2),
        "hex",
      );
  }
};
