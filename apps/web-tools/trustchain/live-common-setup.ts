import "../live-common-setup-network";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";

registerTransportModule({
  id: "webhid",

  open: id => {
    if (id.startsWith("webhid")) {
      return TransportWebHID.create();
    }
    return null;
  },

  disconnect: id =>
    id.startsWith("webhid")
      ? Promise.resolve() // nothing to do
      : null,
});
