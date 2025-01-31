import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Sui from "../src/Sui";

test("Sui init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const sui = new Sui(transport);
  expect(sui).not.toBe(undefined);
});
