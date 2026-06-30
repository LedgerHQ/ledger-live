import "../live-common-setup-network";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { DeviceManagementKitBuilder } from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { listen } from "@ledgerhq/logs";
import { firstValueFrom } from "rxjs";

listen(log => {
  console.log(log.type + ": " + log.message);
});

const dmk = new DeviceManagementKitBuilder().addTransport(webHidTransportFactory).build();

registerTransportModule({
  id: "dmk",
  open: async () => {
    const device = await firstValueFrom(dmk.startDiscovering({}));
    await dmk.stopDiscovering();
    const sessionId = await dmk.connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    return new DmkCompatTransport(dmk, sessionId);
  },
  disconnect: () => Promise.resolve(),
});
