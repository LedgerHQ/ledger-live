import BigNumber from "bignumber.js";
import { compareAddress } from "./getCoinAndAmounts";

export function calculateAmount(
  sender: string,
  address: string,
  amount_in: BigNumber,
  amount_out: BigNumber,
): BigNumber {
  const is_sender: boolean = compareAddress(sender, address);
  // LL negates the amount for SEND transactions
  // to show positive amount on the send transaction (ex: in "cancel" tx, when amount will be returned to our account)
  // we need to make it negative
  return is_sender ? amount_out.minus(amount_in) : amount_in.minus(amount_out);
}
