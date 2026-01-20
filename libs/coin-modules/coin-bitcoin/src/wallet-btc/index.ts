import { Currency } from "./crypto/types";
import BitcoinLikeWallet from "./wallet";
import { DerivationModes, InputInfo, OutputInfo, TransactionInfo } from "./types";
import { Account, SerializedAccount } from "./account";
import { TX, Input, Output } from "./storage/types";
import { CoinSelect } from "./pickingstrategies/CoinSelect";
import { DeepFirst } from "./pickingstrategies/DeepFirst";
import { Merge } from "./pickingstrategies/Merge";
import { isValidAddress, isTaprootAddress } from "./utils";

export { getWalletAccount } from "./getWalletAccount";

export {
  BitcoinLikeWallet,
  type Account,
  type SerializedAccount,
  DerivationModes,
  type Input,
  type Output,
  type InputInfo,
  type OutputInfo,
  type TransactionInfo,
  type TX,
  CoinSelect,
  DeepFirst,
  Merge,
  isValidAddress,
  isTaprootAddress,
  type Currency,
};

let wallet: BitcoinLikeWallet | null = null;

const getWallet = () => {
  if (!wallet) {
    wallet = new BitcoinLikeWallet();
  }
  return wallet;
};

export default getWallet();
