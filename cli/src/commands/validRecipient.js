// @flow

import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import { currencyOpt, deviceOpt, inferCurrency } from "../scan";

export default {
  description: "Validate a recipient address",
  args: [
    {
      name: "recipient",
      alias: "r",
      type: String,
      desc: "the address to validate"
    },
    currencyOpt,
    deviceOpt
  ],
  job: (
    arg: $Shape<{
      recipient: string,
      currency: string,
      device: string
    }>
  ) =>
    inferCurrency(arg)
      .toPromise()
      .then(currency =>
        isValidRecipient({
          currency,
          recipient: arg.recipient
        })
      )
      .then(
        warning =>
          warning ? { type: "warning", warning } : { type: "success" },
        error => ({ type: "error", error: error.message })
      )
};
