import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Celo from "../src/Celo";

test("Celo init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const dot = new Celo(transport);
  expect(dot).not.toBe(undefined);
});
