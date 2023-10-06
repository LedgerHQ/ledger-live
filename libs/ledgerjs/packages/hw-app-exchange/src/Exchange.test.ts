import {
  createTransportRecorder,
  MockTransport,
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Exchange, { createExchange, ExchangeTypes, RateTypes } from "./Exchange";
import { TextEncoder } from "util";
import BigNumber from "bignumber.js";

describe("Contrustructor", () => {
  [ExchangeTypes.Fund, ExchangeTypes.Sell, ExchangeTypes.Swap].forEach(exchangeType => {
    it(`Exchange (value of ${exchangeType}) init with default rate types of fixed`, async () => {
      const transport = await openTransportReplayer(RecordStore.fromString(""));
      const exchange = new Exchange(transport, exchangeType);
      expect(exchange.transactionRate).toBe(RateTypes.Fixed);
    });

    [RateTypes.Fixed, RateTypes.Floating].forEach(rateType => {
      it(`Exchange (value of ${exchangeType}) init with rate types of value ${rateType}`, async () => {
        const transport = await openTransportReplayer(RecordStore.fromString(""));
        const exchange = new Exchange(transport, exchangeType, rateType);
        expect(exchange.transactionRate).toBe(rateType);
      });
    });
  });
});

describe("startNewTransaction", () => {
  const textEncoder = new TextEncoder();
  const mockResponse = "2ac38f187c"; // Response of length 10

  it("sends a correct sequence of APDU", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(
      Buffer.concat([
        textEncoder.encode(mockResponse),
        Buffer.from([0x90, 0x00]), // StatusCodes.OK
      ]),
    );
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), ExchangeTypes.Swap);

    // When
    const result = await exchange.startNewTransaction();

    // Then
    const expectCommand = Buffer.from([
      0xe0,
      0x03, // Start Exchance
      RateTypes.Fixed,
      ExchangeTypes.Swap,
      0x00, // Data
    ]).toString("hex");
    expect(recordStore.queue[0][0]).toBe(expectCommand);
    expect(result).toEqual(mockResponse);
  });

  // TOFIX: TransportError is not recognize as an Error type
  xit("throws an error if status is not ok", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(
      Buffer.concat([textEncoder.encode(mockResponse), Buffer.from([0x6a, 0x80])]),
    );
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), ExchangeTypes.Swap);

    // When & Then
    expect(async () => await exchange.startNewTransaction()).toThrowError();
  });
});

describe("setPartnerKey", () => {
  it("sends legacy info", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), ExchangeTypes.Swap);
    const info = {
      name: "LTX",
      curve: "WHATEVER",
      publicKey: Buffer.from("1234567890abcdef", "hex"),
    };
    // <DATA_SIZE><DATA>
    //   <DATA> = <NAME_SIZE><NAME><PUBKEY>
    const hexEncodedInfoExpected = "0c034c54581234567890abcdef";

    // When
    await exchange.setPartnerKey(info);

    // Then
    const expectCommand = Buffer.from([0xe0, 0x04, RateTypes.Fixed, ExchangeTypes.Swap]).toString(
      "hex",
    );
    expect(recordStore.queue[0][0]).toBe(expectCommand + hexEncodedInfoExpected);
  });

  it("sends NG info", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = createExchange(new transport(mockTransport), ExchangeTypes.SwapNg);
    const info = {
      name: "LTX",
      curve: "secp256k1",
      publicKey: Buffer.from("1234567890abcdef", "hex"),
    };
    // <DATA_SIZE><DATA>
    //   <DATA> = <NAME_SIZE><NAME><CURVE><PUBKEY>
    const hexEncodedInfoExpected = "0d034c5458001234567890abcdef";

    // When
    await exchange.setPartnerKey(info);

    // Then
    const expectCommand = Buffer.from([0xe0, 0x04, RateTypes.Fixed, ExchangeTypes.SwapNg]).toString(
      "hex",
    );
    expect(recordStore.queue[0][0]).toBe(expectCommand + hexEncodedInfoExpected);
  });
});

describe("processTransaction", () => {
  it("sends legacy info", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), ExchangeTypes.Swap);

    const tx = Buffer.from("1234567890abcdef", "hex");
    const fee = new BigNumber("10");
    const hexEncodedInfoExpected = "101234567890abcdef010a";

    // When
    await exchange.processTransaction(tx, fee);

    // Then
    const expectCommand = Buffer.from([0xe0, 0x06, RateTypes.Fixed, ExchangeTypes.Swap]).toString(
      "hex",
    );
    expect(recordStore.queue[0][0]).toBe(expectCommand + hexEncodedInfoExpected);
  });

  it("sends NG info", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = createExchange(new transport(mockTransport), ExchangeTypes.SwapNg);

    const tx = Buffer.from("1234567890abcdef", "hex");
    const fee = new BigNumber("10");
    const hexEncodedInfoExpected = "101234567890abcdef010a";

    // When
    await exchange.processTransaction(tx, fee);

    // Then
    const expectCommand = Buffer.from([0xe0, 0x06, RateTypes.Fixed, ExchangeTypes.SwapNg]).toString(
      "hex",
    );
    expect(recordStore.queue[0][0]).toBe(expectCommand + hexEncodedInfoExpected);
  });
});
