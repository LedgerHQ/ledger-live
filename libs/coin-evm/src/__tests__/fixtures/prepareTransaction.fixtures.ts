import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount, makeTokenAccount } from "./common.fixtures";
import { EvmNftTransaction, Transaction as EvmTransaction } from "../../types";
import ERC20ABI from "../../abis/erc20.abi.json";

const currency = getCryptoCurrencyById("ethereum");
export const tokenAccount = makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin"));
export const account = makeAccount("0xkvn", currency, [tokenAccount]);
export const transaction: EvmTransaction = Object.freeze({
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9",
  feesStrategy: "custom",
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

export const expectedData = (recipient: string, amount: BigNumber): Buffer =>
  Buffer.from(
    new ethers.utils.Interface(ERC20ABI)
      .encodeFunctionData("transfer", [recipient, amount.toFixed()])
      .slice(2),
    "hex",
  );
