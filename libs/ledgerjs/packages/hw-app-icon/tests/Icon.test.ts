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

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
          => e006000000
          <= 0102039000
        `)
  );
  const icon = new Icon(transport);
  const result = await icon.getAppConfiguration();
  expect(result).toEqual({
    majorVersion: 1,
    minorVersion: 2,
    patchVersion: 3
  });
});

test("should throw on invalid derivation path", async () => {
  const transport = await openTransportReplayer(new RecordStore());
  const icon = new Icon(transport);
  return expect(
    icon.getAddress("some invalid derivation path", false)
  ).rejects.toThrow("EOF: no more APDU to replay");
});
