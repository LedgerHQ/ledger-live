import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import getBitcoinLikeInfo from "../../hw/getBitcoinLikeInfo";
test("1.5.5", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
      => e016000000
      <= 000000050107426974636f696e034254439000
    `)
  );
  const res = await getBitcoinLikeInfo(t);
  expect(res).toMatchObject({
    P2PKH: 0,
    P2SH: 5,
  });
});
test("1.2", async () => {
  const t = await openTransportReplayer(
    RecordStore.fromString(`
      => e016000000
      <= 000507426974636f696e034254439000
    `)
  );
  const res = await getBitcoinLikeInfo(t);
  expect(res).toBe(null);
});
