import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Vet from "../src/Vet";

test("Vechain init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const dot = new Vet(transport);
  expect(dot).not.toBe(undefined);
});
