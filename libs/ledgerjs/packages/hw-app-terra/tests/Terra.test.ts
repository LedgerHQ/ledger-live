import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Terra from "../src/Terra";

test("Terra init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const terra = new Terra(transport);
  expect(terra).not.toBe(undefined);
});
