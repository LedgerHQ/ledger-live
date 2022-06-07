import { map, concatMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { deviceOpt } from "../scan";
import { apdusFromFile } from "../stream";
export default {
  description: "Low level exchange with the device. Send APDUs from stdin.",
  args: [
    deviceOpt,
    {
      name: "file",
      alias: "f",
      type: String,
      typeDesc: "filename",
      desc: "A file can also be provided. By default stdin is used.",
    },
  ],
  job: ({ device, file }: { device: string; file: string }) =>
    withDevice(device || "")((t) =>
      apdusFromFile(file || "-").pipe(concatMap((apdu) => t.exchange(apdu)))
    ).pipe(map((res) => res.toString("hex"))),
};
