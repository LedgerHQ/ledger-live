import { TokenPayment } from "@elrondnetwork/erdjs/out";

import { DECIMALS_LIMIT } from "../constants";

/*
 * Nominate up to the given decimals using the TokenPayment instance.
 */

export const nominate = (amount: string, numDecimals: number = DECIMALS_LIMIT) =>
  TokenPayment.fungibleFromAmount("", amount, numDecimals).toString();
