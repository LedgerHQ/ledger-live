import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Concordium from "../src/Concordium";

test("Concordium init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const concordium = new Concordium(transport);
  expect(concordium).not.toBe(undefined);
});

