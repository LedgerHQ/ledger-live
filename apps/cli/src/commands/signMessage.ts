import fs from "fs";
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import signMessage from "@ledgerhq/live-common/hw/signMessage/index";
import { currencyOpt, inferCurrency } from "../scan";
export default {
  description:
    "Sign a message with the device on specific derivations (advanced)",
  args: [
    currencyOpt,
    {
      name: "path",
      type: String,
      desc: "HDD derivation path",
    },
    {
      name: "message",
      type: String,
      desc: "the message to sign",
    },
    {
      name: "rawMessage",
      type: String,
      desc: "raw message to sign (used by walletconnect)",
    },
    {
      name: "parser",
      type: String,
      desc: "parser used for the message. Default: String",
      default: "String",
    },
  ],
  job: (arg: any) =>
    inferCurrency(arg).pipe(
      mergeMap((currency) => {
        if (!currency) {
          throw new Error("no currency provided");
        }

        if (!arg.path) {
          throw new Error("--path is required");
        }

        switch (arg.parser?.toLowerCase()) {
          case "object":
          case "json":
          case "json.parse":
            arg.message = JSON.parse(arg.message);
            break;

          case "file":
            arg.message = JSON.parse(fs.readFileSync(arg.message, "utf8"));
            break;

          case "string":
          default:
            arg.message = arg.message?.toString();
            break;
        }

        return withDevice(arg.device || "")((t) =>
          from(signMessage(t, { ...arg, currency }))
        );
      })
    ),
};
