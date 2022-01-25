import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import { currencyOpt, deviceOpt, inferCurrency } from "../scan";
export default {
  description: "Validate a recipient address",
  args: [
    {
      name: "recipient",
      alias: "r",
      type: String,
      desc: "the address to validate",
    },
    currencyOpt,
    deviceOpt,
  ],
  job: (
    arg: Partial<{
      recipient: string;
      currency: string;
      device: string;
    }>
  ) =>
    inferCurrency(arg)
      .toPromise()
      .then((currency) =>
        isValidRecipient({
          currency: currency as CryptoCurrency,
          recipient: arg.recipient as string,
        })
      )
      .then(
        (warning) =>
          warning
            ? {
                type: "warning",
                warning,
              }
            : {
                type: "success",
              },
        (error) => ({
          type: "error",
          error: error.message,
        })
      ),
};
