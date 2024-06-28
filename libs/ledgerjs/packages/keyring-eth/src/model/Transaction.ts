import { ethers } from "ethers";
import LL from "@ledgerhq/coin-evm/types/index";

export type SupportedTransaction = ethers.Transaction | LL.Transaction;
