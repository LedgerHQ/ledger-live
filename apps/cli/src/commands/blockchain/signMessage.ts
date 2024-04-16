import fs from "fs";
import { from } from "rxjs";
import { switchMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import signMessage, { prepareMessageToSign } from "@ledgerhq/live-common/hw/signMessage/index";
import { scan, scanCommonOpts } from "../../scan";

export default {
  description: "Sign a message with the device on specific derivations (advanced)",
  args: [
    ...scanCommonOpts,
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
      name: "parser",
      type: String,
      desc: "parser used for the message. Default: String",
      default: "String",
    },
  ],
  job: (opts: any) => {
    return scan(opts).pipe(
      switchMap(account => {
        if (!account.currency) {
          throw new Error("no currency provided");
        }

        switch (opts.parser?.toLowerCase()) {
          case "file":
            opts.message = fs.readFileSync(opts.message, "utf8");
            break;

          case "string":
          default:
            opts.message = opts.message?.toString();
            break;
        }

        const preparedMessage = prepareMessageToSign(
          account,
          Buffer.from(opts.message).toString("hex"),
        );
        return withDevice(opts.device || "")(t => from(signMessage(t, account, preparedMessage)));
      }),
    );
  },
};
