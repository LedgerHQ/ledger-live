import {
  openTransportReplayer,
  RecordStore,
  RecordStoreQueueEmpty,
  RecordStoreInvalidSynthax,
  RecordStoreWrongAPDU,
  RecordStoreRemainingAPDU,
} from "../src";

test("transport", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  const transport = await openTransportReplayer(store);
  const r = await transport.send(0xe0, 0x16, 0, 0);
  expect(r.toString("hex")).toBe("000000050107426974636f696e034254439000");
});

test("RecordStoreQueueEmpty", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(() => store.replayExchange(Buffer.from("00", "hex"))).toThrow(
    (RecordStoreQueueEmpty as unknown) as Error
  );
});

test("ensureQueueEmpty", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
});

test("record", async () => {
  const store = new RecordStore();
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
  store.recordExchange(
    Buffer.from("e016000000", "hex"),
    Buffer.from("000000050107426974636f696e034254439000", "hex")
  );
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  const res = store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(res.toString("hex")).toBe("000000050107426974636f696e034254439000");
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
});

test("toString", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  expect(store.toString()).toBe(
    "=> e016000000\n<= 000000050107426974636f696e034254439000\n"
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(store.toString()).toBe("\n");
});

test("multiple apdu", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
    => e016000000
    <= 000000050107426974636f696e034254439000
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
});

test("invalid apdu", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  expect(() => store.replayExchange(Buffer.from("0000000000", "hex"))).toThrow(
    (RecordStoreWrongAPDU as unknown) as Error
  );
  expect(store.isEmpty()).toBe(false);
  expect(() => store.ensureQueueEmpty()).toThrow(
    (RecordStoreRemainingAPDU as unknown) as Error
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
});

test("skipping apdu mechanism is not on by default", async () => {
  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
    => e001000000
    <= 3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
  `);
  expect(() => store.replayExchange(Buffer.from("e001000000", "hex"))).toThrow(
    (RecordStoreWrongAPDU as unknown) as Error
  );
});

test("skipping apdu mechanism", async () => {
  const store = RecordStore.fromString(
    `
    => e016000000
    <= 000000050107426974636f696e034254439000
    => e001000000
    <= 3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
  `,
    {
      autoSkipUnknownApdu: true,
    }
  );
  expect(
    store.replayExchange(Buffer.from("e001000000", "hex")).toString("hex")
  ).toBe(
    "3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000"
  );
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
});

test("skipping apdu mechanism (customized warning function", async () => {
  let warnings = 0;
  const store = RecordStore.fromString(
    `
    => e016000000
    <= 000000050107426974636f696e034254439000
    => e016000000
    <= 000000050107426974636f696e034254439000
    => e001000000
    <= 3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
  `,
    {
      autoSkipUnknownApdu: true,
      warning: (log) => {
        expect(log).toBe(
          "skipped unmatched apdu (line 2 – expected e016000000)"
        );
        ++warnings;
      },
    }
  );
  store.replayExchange(Buffer.from("e016000000", "hex"));
  expect(
    store.replayExchange(Buffer.from("e001000000", "hex")).toString("hex")
  ).toBe(
    "3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000"
  );
  expect(warnings).toBe(1);
  expect(store.isEmpty()).toBe(true);
  store.ensureQueueEmpty();
});

test("parser to allow different alternative syntax", async () => {
  const reference =
    "=> e016000000\n<= 000000050107426974636f696e034254439000\n=> e016000000\n<= 000000050107426974636f696e034254439000\n=> e001000000\n<= 3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000\n";

  expect(RecordStore.fromString(reference).toString()).toBe(reference);

  expect(
    RecordStore.fromString(
      `
  =>e016000000

  <=000000050107426974636f696e034254439000
  =>e016000000
  <=     000000050107426974636f696e034254439000


=>e001000000
  <=3110000405312e352e35042300000004312e37002013fe17e06cf2f710d33328aa46d1053f8fadd48dcaeca2c5512dd79e2158d5779000
`
    ).toString()
  ).toBe(reference);
});

test("invalid syntaxes", async () => {
  expect(() =>
    RecordStore.fromString(
      "=>e016000000<=000000050107426974636f696e034254439000"
    )
  ).toThrow((RecordStoreInvalidSynthax as unknown) as Error);
  expect(() => RecordStore.fromString("=>e016000000")).toThrow(
    (RecordStoreInvalidSynthax as unknown) as Error
  );
  expect(() =>
    RecordStore.fromString("e016000000\n000000050107426974636f696e034254439000")
  ).toThrow((RecordStoreInvalidSynthax as unknown) as Error);
  expect(() =>
    RecordStore.fromString(
      "=>e016000000\n000000050107426974636f696e034254439000"
    )
  ).toThrow((RecordStoreInvalidSynthax as unknown) as Error);
  expect(() => RecordStore.fromString("=>e016000000\n=>e016000000")).toThrow(
    (RecordStoreInvalidSynthax as unknown) as Error
  );
  expect(() => RecordStore.fromString("=>e016000000\n<=AZERTY")).toThrow(
    (RecordStoreInvalidSynthax as unknown) as Error
  );
  expect(() =>
    RecordStore.fromString(
      "=>e016000000\n<=00000005Z10742674636f696e034254439000"
    )
  ).toThrow((RecordStoreInvalidSynthax as unknown) as Error);
});
