import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Str from "../src/Str";

test("getAppConfiguration", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e006000000
    <= 000300019000
    `)
  );
  const str = new Str(transport);
  const result = await str.getAppConfiguration();
  expect(result).toEqual({ multiOpsEnabled: false, version: "3.0.1" });
});

test("getPublicKey", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e002010117038000002c8000009480000000766961206c756d696e61
    <= 7691d85048acc4ed085d9061ce0948bbdf7de6a92b790aaf241d31b7dcaa423881b9f7cb3bd2fad4f0fdab9da1407e8e85f702fa58584fba3104e4549b85ca8046d73a4010870bc4765eff7e0bafcfe91390c4475ba3fcc598750758ed770e0f9000
    `)
  );
  const str = new Str(transport);
  const { publicKey, raw } = await str.getPublicKey("44'/148'/0'", true, true);
  expect(publicKey).toEqual(
    "GB3JDWCQJCWMJ3IILWIGDTQJJC5567PGVEVXSCVPEQOTDN64VJBDQBYX"
  );
  expect(raw.toString("hex")).toEqual(
    "7691d85048acc4ed085d9061ce0948bbdf7de6a92b790aaf241d31b7dcaa4238"
  );
});

test("signTransaction", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e004008096038000002c80000094800000007ac33997544e3175d266bd022439b22cdb16508c01163f26e5cb2a3e1045a979000000020000000020da998b75e42b1f7f85d075c127f5b246df12ad96f010bcf7f76f72b16e57130000006400c5b4a5000000190000000000000000000000010000000000000001000000009541f02746240c1e9f3843d28e56f0a583ecd27502fb0f4a27d4d0922f
    <= 9000
    => e004800013e064a200000000000000000098968000000000
    <= 79e6da561676d16f17e91ad0dbbe917e3da0fffe660aa9f277669385960b0aec8dcf002b7305b329cc02f2eabd2f20320dee4828b412ed2850b9771ffb23920d9000
    `)
  );
  const str = new Str(transport);
  const transaction = Buffer.from(
    "7ac33997544e3175d266bd022439b22cdb16508c01163f26e5cb2a3e1045a979000000020000000020da998b75e42b1f7f85d075c127f5b246df12ad96f010bcf7f76f72b16e57130000006400c5b4a5000000190000000000000000000000010000000000000001000000009541f02746240c1e9f3843d28e56f0a583ecd27502fb0f4a27d4d0922fe064a200000000000000000098968000000000",
    "hex"
  );
  const { signature } = await str.signTransaction("44'/148'/0'", transaction);
  const result = signature.toString("hex");
  expect(result).toEqual(
    "79e6da561676d16f17e91ad0dbbe917e3da0fffe660aa9f277669385960b0aec8dcf002b7305b329cc02f2eabd2f20320dee4828b412ed2850b9771ffb23920d"
  );
});
