import BigNumber from "bignumber.js";
import { Vote } from "../types";

/**
 * Icon transaction
 */
export type APITransaction ={
  fees?: BigNumber | null | undefined;
  value?: BigNumber | null | undefined;
  value_decimal?: BigNumber | null | undefined;
  method?: string | null | undefined;
  transaction_fee?: BigNumber | null | undefined;
  status?: string | null | undefined;
  hash?: string | null | undefined;
  from_address?: string | null | undefined;
  to_address?: string | null | undefined;
  nonce?: number | undefined;
  data?: string | null | undefined;
  block_number?: number | null | undefined;
  block_timestamp?: number | null | undefined;
  transaction_type?: string | null | undefined;
  id?: string | null | undefined;
  votes: Vote[];
  stepLimit?: BigNumber;
};