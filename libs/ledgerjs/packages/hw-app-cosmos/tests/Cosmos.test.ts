import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Cosmos from "../src/Cosmos";

test("Comos init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const cosmos = new Cosmos(transport);
  expect(cosmos).not.toBe(undefined);
});
