import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Polkadot from "../src/Polkadot";

test("Polkadot init", async () => {
  const transport = await openTransportReplayer(RecordStore.fromString(""));
  const dot = new Polkadot(transport);
  expect(dot).not.toBe(undefined);
});
