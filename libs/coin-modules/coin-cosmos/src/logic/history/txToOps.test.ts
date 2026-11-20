import BigNumber from "bignumber.js";
import { CosmosTx } from "../../types";
import { parseCosmosOperations, txToOps } from "./txToOps";

const ADDRESS = "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl";
const OTHER_ADDRESS = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
const REMOTE_ADDRESS = "osmo1xx72kqjlf2qqj88h0wakwv6rp0v8fwh74z9q89";
const UNIT = "uatom";
const FEE = "2500";
const TX_HASH = "9C3A5B0E7D1F4A62B8E0C4D7F1A3B5C9E2D4F6A8B0C1D3E5F7A9B1C3D5E7F901"; // gitleaks:allow
const ACCOUNT_ID = `js:2:cosmos:${ADDRESS}:`;

const buildTx = (
  messages: Record<string, unknown>[],
  events: CosmosTx["events"] = [],
  overrides: Partial<CosmosTx> = {},
): CosmosTx => ({
  code: 0,
  codespace: "",
  data: "",
  events,
  gas_used: "100000",
  gas_wanted: "120000",
  height: "27000000",
  info: "",
  logs: [],
  raw_log: "",
  timestamp: "2026-05-02T10:23:08Z",
  tx: {
    "@type": "/cosmos.tx.v1beta1.Tx",
    body: { messages, memo: "" },
    auth_info: {
      signer_infos: [{ sequence: "7" }],
      fee: { amount: [{ denom: UNIT, amount: FEE }] },
    },
    signatures: [],
  },
  txhash: TX_HASH,
  ...overrides,
});

const ibcTransferMessage = (overrides: Record<string, unknown> = {}) => ({
  "@type": "/ibc.applications.transfer.v1.MsgTransfer",
  source_port: "transfer",
  source_channel: "channel-141",
  token: { denom: UNIT, amount: "1000000" },
  sender: ADDRESS,
  receiver: REMOTE_ADDRESS,
  ...overrides,
});

const recvPacketMessage = {
  "@type": "/ibc.core.channel.v1.MsgRecvPacket",
  signer: "cosmos1relayer",
};

const fungibleTokenPacketEvent = (
  attributes: Record<string, string>,
): CosmosTx["events"][number] => ({
  type: "fungible_token_packet",
  attributes: Object.entries(attributes).map(([key, value]) => ({ key, value })),
});

const incomingPacket = (overrides: Record<string, string> = {}) =>
  fungibleTokenPacketEvent({
    sender: REMOTE_ADDRESS,
    receiver: ADDRESS,
    amount: "2500000",
    denom: `transfer/channel-141/${UNIT}`,
    ...overrides,
  });

const parse = (tx: CosmosTx, address = ADDRESS) =>
  parseCosmosOperations({ address, unitCode: UNIT }, [tx]);

describe("parseCosmosOperations IBC MsgTransfer", () => {
  it("parses an IBC send of the account as an OUT operation", () => {
    const operations = parse(buildTx([ibcTransferMessage()]));

    expect(operations).toEqual([
      expect.objectContaining({
        hash: TX_HASH,
        type: "OUT",
        senders: [ADDRESS],
        recipients: [REMOTE_ADDRESS],
        hasFailed: false,
        blockHeight: 27000000,
      }),
    ]);
  });

  it("adds the fee to the value of an IBC send", () => {
    const [operation] = parse(buildTx([ibcTransferMessage()]));

    expect({ value: operation.value, fee: operation.fee }).toEqual({
      value: new BigNumber("1002500"),
      fee: new BigNumber(FEE),
    });
  });

  it("sums several IBC sends of the same transaction", () => {
    const [operation] = parse(
      buildTx([
        ibcTransferMessage(),
        ibcTransferMessage({ token: { denom: UNIT, amount: "500000" } }),
      ]),
    );

    expect(operation.value).toEqual(new BigNumber("1502500"));
  });

  it("lists a recipient once when two IBC sends target the same receiver", () => {
    const [operation] = parse(buildTx([ibcTransferMessage(), ibcTransferMessage()]));

    expect(operation.recipients).toEqual([REMOTE_ADDRESS]);
  });

  it("ignores an IBC send of another sender", () => {
    const operations = parse(buildTx([ibcTransferMessage({ sender: OTHER_ADDRESS })]));

    expect(operations).toEqual([]);
  });

  it("ignores an IBC send of another denom", () => {
    const operations = parse(
      buildTx([ibcTransferMessage({ token: { denom: "uosmo", amount: "1000000" } })]),
    );

    expect(operations).toEqual([]);
  });

  it("ignores an IBC send without a receiver", () => {
    const operations = parse(buildTx([ibcTransferMessage({ receiver: "" })]));

    expect(operations).toEqual([]);
  });

  it("keeps the memo of an IBC send", () => {
    const tx = buildTx([ibcTransferMessage()]);
    tx.tx.body.memo = "bridge to osmosis";

    const [operation] = parse(tx);

    expect(operation.extra).toEqual({ memo: "bridge to osmosis" });
  });

  it("flags a failed IBC send", () => {
    const [operation] = parse(buildTx([ibcTransferMessage()], [], { code: 5 }));

    expect(operation.hasFailed).toBe(true);
  });
});

describe("parseCosmosOperations IBC MsgRecvPacket", () => {
  it("parses an IBC receive for the account as an IN operation", () => {
    const operations = parse(buildTx([recvPacketMessage], [incomingPacket()]));

    expect(operations).toEqual([
      expect.objectContaining({
        hash: TX_HASH,
        type: "IN",
        senders: [REMOTE_ADDRESS],
        recipients: [ADDRESS],
        value: new BigNumber("2500000"),
      }),
    ]);
  });

  it("reads the amount of a receive that lists several denoms", () => {
    const operations = parse(
      buildTx([recvPacketMessage], [incomingPacket({ amount: `10ibc/AB12,2500000${UNIT}` })]),
    );

    expect(operations[0].value).toEqual(new BigNumber("2500000"));
  });

  it("sums several packets received in the same transaction", () => {
    const operations = parse(
      buildTx([recvPacketMessage], [incomingPacket(), incomingPacket({ amount: "500000" })]),
    );

    expect(operations[0].value).toEqual(new BigNumber("3000000"));
  });

  it("ignores a packet received by another account", () => {
    const operations = parse(
      buildTx([recvPacketMessage], [incomingPacket({ receiver: OTHER_ADDRESS })]),
    );

    expect(operations).toEqual([]);
  });

  it("ignores a packet of another denom", () => {
    const operations = parse(
      buildTx([recvPacketMessage], [incomingPacket({ denom: "transfer/channel-141/uosmo" })]),
    );

    expect(operations).toEqual([]);
  });

  it("ignores a packet without a sender", () => {
    const operations = parse(buildTx([recvPacketMessage], [incomingPacket({ sender: "" })]));

    expect(operations).toEqual([]);
  });

  it("ignores events that are not fungible token packets", () => {
    const operations = parse(
      buildTx(
        [recvPacketMessage],
        [{ type: "transfer", attributes: [{ key: "recipient", value: ADDRESS }] }],
      ),
    );

    expect(operations).toEqual([]);
  });
});

describe("txToOps", () => {
  it("wraps an IBC send with the account id and the operation id", () => {
    const [operation] = txToOps({ address: ADDRESS, unitCode: UNIT }, ACCOUNT_ID, [
      buildTx([ibcTransferMessage()]),
    ]);

    expect(operation).toEqual(
      expect.objectContaining({
        id: `${ACCOUNT_ID}-${TX_HASH}-OUT`,
        accountId: ACCOUNT_ID,
        type: "OUT",
        transactionSequenceNumber: new BigNumber(7),
      }),
    );
  });
});
