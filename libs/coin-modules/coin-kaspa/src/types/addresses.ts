import { BigNumber } from "bignumber.js";

export type AccountAddress = {
  type: number;
  index: number;
  address: string;
  balance: BigNumber;
  active: boolean;
  timestamp: number | null;
};

export type AccountAddresses = {
  usedReceiveAddresses: AccountAddress[];
  usedChangeAddresses: AccountAddress[];
  nextChangeAddress: AccountAddress;
  nextReceiveAddress: AccountAddress;
  totalBalance: BigNumber;
  spendableBalance: BigNumber;
};
