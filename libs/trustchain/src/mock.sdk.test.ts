import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import { scenario } from "./test-scenarios/success";
import { setEnv } from "@ledgerhq/live-env";

setEnv("MOCK", "true");
test("scenario in mock mode", async () => {
  scenario(new TransportReplayer(new RecordStore()));
});
