type Event =
  | [callback: string]
  | [callback: string, payload: string]
  | [callback: string, payload: string, eager: boolean]; // callback, payload, eager

type Scenario = {
  describe: string; // Description of the test
  device: string; // RecordStore of apdu exchanges
  events: Array<Event>;
};

const scenarios: Array<Scenario> = [
  // Happy path run, no secure channel check, bulk operation going through without a problem
  {
    describe: "Should pass without errors",
    device: `
  => 0000000001
  <= 9000
  => 0000000002
  <= 9000
  => 0000000003
  <= 9000
  => 0001
  <= 9000
  => 0002
  <= 9000
  => 0003
  <= 9000
  => 0004
  <= 9000
`,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "0000000002" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 3, "data": "0000000003" }'],
      ["onmessage", '{ "query": "bulk", "nonce": 4, "data": ["0001", "0002", "0003", "0004"] }'],
    ],
  },
  // Triggering a secure channel prompt where the user refuses
  {
    describe: "Should map rejected allow my ledger",
    device: `
  => 0000000001
  <= 9000
  => e051000000
  <= 5501
`,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "e051000000" }'],
    ],
  },
  // Triggering a secure channel prompt where the user approves
  {
    describe: "Should emit events for secure channel successfully",
    device: `
  => 0000000001
  <= 9000
  => e051000000
  <= 9000
  => 0000000002
  <= 9000
`,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "e051000000" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 3, "data": "0000000002" }'],
      ["onmessage", '{ "query": "success", "payload": "0000" }', true],
    ],
  },
  // Locked device response throws a mapped error
  {
    describe: "Should break runner connection if device is locked",
    device: `
  => 0000000001
  <= 5515
`,
    events: [["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }']],
  },

  // Other errors (not in bulk) don't throw
  {
    describe: "Should continue exchange if HSM handles the error",
    device: `
    => 0000000001
    <= 662f
    => 0000000002
    <= 9000
  `,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "0000000002" }'],
      ["onmessage", '{ "query": "success", "payload": "0000" }', true],
    ],
  },
  // If the websocket closes without a response after sending a !9000 status
  // we return that mapped error instead of the websocket one.
  {
    describe: "Non 9000 status that cause a ws close, should be mapped",
    device: `
  => 0000000001
  <= 9000
  => 0000000002
  <= 9000
  => 0000000003
  <= 5501
`,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "0000000002" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 3, "data": "0000000003" }'],
      ["onclose"],
    ],
  },
  // Errors in bulk always throw
  {
    describe: "Regardless of the error, if we are in bulk, it can't recover",
    device: `
  => 0000000001
  <= 9000
  => 0000000002
  <= 9000
  => 0000000003
  <= 9000
  => 0001
  <= 9000
  => 0002
  <= 9000
  => 0003
  <= 5501
  => 0004
  <= 9000
`,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "0000000002" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 3, "data": "0000000003" }'],
      ["onmessage", '{ "query": "bulk", "nonce": 4, "data": ["0001", "0002", "0003", "0004"] }'],
    ],
  },
  // Network errors should throw
  {
    describe: "Network errors should break connection",
    device: `
  => 0000000001
  <= 9000
  => 0000000002
  <= 9000
`,
    events: [
      ["onmessage", '{ "query": "exchange", "nonce": 1, "data": "0000000001" }'],
      ["onmessage", '{ "query": "exchange", "nonce": 2, "data": "0000000002" }'],
      ["onerror"],
    ],
  },
];

export default scenarios;
