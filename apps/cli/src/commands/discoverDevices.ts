import { map, tap, scan as rxScan } from "rxjs/operators";
import { discoverDevices } from "@ledgerhq/live-common/hw/index";
import type { DeviceEvent } from "@ledgerhq/live-common/hw/index";

export default {
  args: [
    {
      name: "module",
      alias: "m",
      type: String,
      desc: "filter a specific module (either hid | ble)",
    },
    {
      name: "interactive",
      alias: "i",
      type: Boolean,
      desc:
        "interactive mode that accumulate the events instead of showing them",
    },
  ],
  job: ({
    module,
    interactive,
  }: Partial<{
    module: string;
    interactive: boolean;
  }>) => {
    const events = discoverDevices((m) =>
      !module ? true : module.split(",").includes(m.id)
    );
    if (!interactive) return events;
    return events
      .pipe(
        rxScan((acc: DeviceEvent[], value) => {
          let copy;

          if (value.type === "remove") {
            copy = acc.filter((a) => a.id === value.id);
          } else {
            const existing = acc.find((o) => o.id === value.id);

            if (existing) {
              const i = acc.indexOf(existing);
              copy = [...acc];

              if (value.name) {
                copy[i] = value;
              }
            } else {
              copy = acc.concat({
                ...value
              });
            }
          }

          return copy;
        }, [])
      )
      .pipe(
        tap(() => {
          // eslint-disable-next-line no-console
          console.clear();
        }),
        map((acc) =>
          acc
            .map((o) => `${(o.name || "(no name)").padEnd(40)} ${o.id}`)
            .join("\n")
        )
      );
  },
};
