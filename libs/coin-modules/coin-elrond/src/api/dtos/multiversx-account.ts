import BigNumber from "bignumber.js";

export class MultiversXAccount {
  balance: BigNumber;
  nonce: number;
  isGuarded: boolean;
  blockHeight: number;

  constructor(
    balance: BigNumber,
    nonce: number,
    isGuarded: boolean | null | undefined,
    blockHeight: number,
  ) {
    this.balance = balance;
    this.nonce = nonce;
    this.isGuarded = isGuarded ? true : false;
    this.blockHeight = blockHeight;
  }
}
