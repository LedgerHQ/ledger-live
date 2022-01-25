import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Algorand from "../src/Algorand";

test("Algorand init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const algo = new Algorand(transport);
  expect(algo).not.toBe(undefined);
});
