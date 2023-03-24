import {
  createTransportRecorder,
  MockTransport,
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Exchange, { ExchangeTypes, RateTypes } from "./Exchange";

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
  it("give correct sequence of APDU", async () => {
    // Given
    const recordStore = new RecordStore();
    const mockTransport = new MockTransport(
      Buffer.from([0x6e, 0x6f, 0x6e, 0x63, 0x65, 0x90, 0x00])
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
    expect(result).toEqual("nonce");
  });
});
