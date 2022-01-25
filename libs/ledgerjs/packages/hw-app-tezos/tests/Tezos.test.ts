import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Tezos from "../src/Tezos";

test("Tezos init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const xtz = new Tezos(transport);
  expect(xtz).not.toBe(undefined);
});
