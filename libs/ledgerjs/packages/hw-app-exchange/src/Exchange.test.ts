import {
  createTransportRecorder,
  MockTransport,
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Exchange, { ExchangeTypes, RateTypes } from "./Exchange";
import { TextEncoder } from "util";

describe("Contrustructor", () => {
  [ExchangeTypes.Fund, ExchangeTypes.Sell, ExchangeTypes.Swap].forEach(
    (exchangeType) => {
      it(`Exchange (value of ${exchangeType}) init with default rate types of fixed`, async () => {
        const transport = await openTransportReplayer(
          RecordStore.fromString("")
        );
        const exchange = new Exchange(transport, exchangeType);
        expect(exchange.transactionRate).toBe(RateTypes.Fixed);
      });

      [RateTypes.Fixed, RateTypes.Floating].forEach((rateType) => {
        it(`Exchange (value of ${exchangeType}) init with rate types of value ${rateType}`, async () => {
          const transport = await openTransportReplayer(
            RecordStore.fromString("")
          );
          const exchange = new Exchange(transport, exchangeType, rateType);
          expect(exchange.transactionRate).toBe(rateType);
        });
      });
    }
  );
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
      ])
    );
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(
      new transport(mockTransport),
      ExchangeTypes.Swap
    );

    // When
    const result = await exchange.startNewTransaction();

    // Then
    const expectCommand = Buffer.from([
      0xe0,
      0x03, // Start Exchance
      ExchangeTypes.Swap,
      RateTypes.Fixed,
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
      Buffer.concat([
        textEncoder.encode(mockResponse),
        Buffer.from([0x6a, 0x80]),
      ])
    );
    const transport = createTransportRecorder(mockTransport, recordStore);
    const exchange = new Exchange(
      new transport(mockTransport),
      ExchangeTypes.Swap
    );

    // When & Then
    expect(async () => await exchange.startNewTransaction()).toThrowError();
  });
});
