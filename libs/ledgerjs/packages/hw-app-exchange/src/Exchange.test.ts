import {
  createTransportRecorder,
  MockTransport,
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Exchange, { createExchange, ExchangeTypes, RateTypes } from "./Exchange";
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
  const recordStore = new RecordStore();

  afterEach(() => {
    recordStore.queue = [];
  });

  it("sends a correct sequence of APDU when Swap", async () => {
    // Given
    const mockNonceResponse = "2ac38f187c"; // Response of length 10
    const mockTransport = new MockTransport(
      Buffer.concat([
        Buffer.from(mockNonceResponse),
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
    expect(result).toEqual(mockNonceResponse);
  });

  it.each([
    { name: "Sell", type: ExchangeTypes.Sell },
    { name: "Fund", type: ExchangeTypes.Fund },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ])("returns a base64 nonce when $name", async ({ name, type }) => {
    // Given
    const mockNonceResponse = "2ac38f187c2ac38f187c2ac38f187c7c"; // Response of length 10
    const mockTransport = new MockTransport(
      Buffer.concat([
        Buffer.from(mockNonceResponse),
        Buffer.from([0x90, 0x00]), // StatusCodes.OK
      ]),
    );
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), type);

    // When
    const result = await exchange.startNewTransaction();

    // Then
    const expectCommand = Buffer.from([
      0xe0,
      0x03, // Start Exchance
      RateTypes.Fixed,
      type,
      0x00, // Data
    ]).toString("hex");
    const expectedNonce = btoa(mockNonceResponse);
    expect(recordStore.queue[0][0]).toBe(expectCommand);
    expect(result).toEqual(expectedNonce);
  });

  it.each([
    { name: "Swap NG", type: ExchangeTypes.SwapNg },
    { name: "Sell NG", type: ExchangeTypes.SellNg },
    { name: "Fund NG", type: ExchangeTypes.FundNg },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ])("returns a 32 bytes nonce when $name", async ({ name, type }) => {
    // Given
    const mockNonceResponse = Buffer.from("2ac38f187c2ac38f187c2ac38f187c7c"); // Response of 32 bytes
    const mockTransport = new MockTransport(
      Buffer.concat([
        mockNonceResponse,
        Buffer.from([0x90, 0x00]), // StatusCodes.OK
      ]),
    );
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), ExchangeTypes.SwapNg);

    // When
    const result = await exchange.startNewTransaction();

    // Then
    const expectCommand = Buffer.from([
      0xe0,
      0x03, // Start Exchance
      RateTypes.Fixed,
      ExchangeTypes.SwapNg,
      0x00, // Data
    ]).toString("hex");
    expect(recordStore.queue[0][0]).toBe(expectCommand);
    expect(result).toEqual(mockNonceResponse.toString("hex"));
  });

  // TOFIX: TransportError is not recognize as an Error type
  xit("throws an error if status is not ok", async () => {
    // Given
    const mockResponse = "2ac38f187c"; // Response of length 10
    const mockTransport = new MockTransport(
      Buffer.concat([Buffer.from(mockResponse), Buffer.from([0x6a, 0x80])]),
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
    // <OVERALL_LENGTH><DATA_SIZE><DATA>
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
    // <OVERALL_LENGTH><DATA_SIZE><DATA>
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
    // <OVERALL_LENGTH><TX_LENGTH><TX><FEE_LENGTH><FEE>
    const hexEncodedInfoExpected = "0b081234567890abcdef010a";

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
    // <OVERALL_LENGTH><ENC_TX_FORMAT><TX_LENGTH><TX><FEE_LENGTH><FEE>
    const hexEncodedInfoExpected = "0d" + "00" + "0008" + "1234567890abcdef" + "01" + "0a";

    // When
    await exchange.processTransaction(tx, fee, "raw");

    // Then
    const expectCommand = Buffer.from([0xe0, 0x06, RateTypes.Fixed, ExchangeTypes.SwapNg]).toString(
      "hex",
    );
    expect(recordStore.queue[0][0]).toBe(expectCommand + hexEncodedInfoExpected);
  });

  it("sends NG info of larger than 255 bytes", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = createExchange(new transport(mockTransport), ExchangeTypes.SwapNg);

    const value = Array(200).fill("abc").join("");
    const tx = Buffer.from(value, "hex");
    const fee = new BigNumber("10");
    // <ENC_TX_FORMAT><TX_LENGTH><TX><FEE_LENGTH><FEE>
    const hexEncodedInfoExpected = "00" + "012c" + value + "01" + "0a";

    // When
    await exchange.processTransaction(tx, fee, "raw");

    // Then
    let expectCommand = Buffer.from([
      0xe0,
      0x06,
      RateTypes.Fixed,
      ExchangeTypes.SwapNg | (0x02 << 4),
    ]).toString("hex");
    const dataLength = "ff";
    expect(recordStore.queue[0][0]).toBe(
      expectCommand + dataLength + hexEncodedInfoExpected.substring(0, 255 * 2),
    );
    expectCommand = Buffer.from([
      0xe0,
      0x06,
      RateTypes.Fixed,
      ExchangeTypes.SwapNg | (0x01 << 4),
    ]).toString("hex");
    const remainingDataLength = (hexEncodedInfoExpected.length - 255 * 2) / 2;
    expect(recordStore.queue[1][0]).toBe(
      expectCommand +
        remainingDataLength.toString(16) +
        hexEncodedInfoExpected.substring(255 * 2, hexEncodedInfoExpected.length),
    );
  });
});

describe("checkTransactionSignature", () => {
  it("sends legacy info", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(Buffer.from([0, 0x90, 0x00]));
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(new transport(mockTransport), ExchangeTypes.Swap);

    const txSig = Buffer.from("1234567890abcdef", "hex");
    const hexEncodedInfoExpected = "081234567890abcdef";

    // When
    await exchange.checkTransactionSignature(txSig);

    // Then
    const expectCommand = Buffer.from([0xe0, 0x07, RateTypes.Fixed, ExchangeTypes.Swap]).toString(
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

    const txSig = Buffer.from("1234567890abcdef", "hex");
    const hexEncodedInfoExpected = "0a01011234567890abcdef";

    // When
    await exchange.checkTransactionSignature(txSig);

    // Then
    const expectCommand = Buffer.from([0xe0, 0x07, RateTypes.Fixed, ExchangeTypes.SwapNg]).toString(
      "hex",
    );
    expect(recordStore.queue[0][0]).toBe(expectCommand + hexEncodedInfoExpected);
  });
});
