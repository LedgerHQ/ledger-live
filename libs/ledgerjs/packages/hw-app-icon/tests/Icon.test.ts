import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Icon from "../src/Icon";

test("Icon init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const icx = new Icon(transport);
  expect(icx).not.toBe(undefined);
});
