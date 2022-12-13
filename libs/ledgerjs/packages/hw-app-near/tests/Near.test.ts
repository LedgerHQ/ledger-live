import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Near from "../src/Near";

test("Near init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const near = new Near(transport);
  expect(near).not.toBe(undefined);
});
