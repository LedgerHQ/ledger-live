import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import Exchange, { ExchangeTypes } from "./Exchange";
import Transport from "@ledgerhq/hw-transport";

describe("startNewTransaction", () => {
  let transport: Transport;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({});
  });
  afterAll(async () => {
    transport.close();
  });

  it("sends a correct sequence of APDU", async () => {
    // Given
    const exchange = new Exchange(transport, ExchangeTypes.Swap);

    // When
    const result = await exchange.startNewTransaction();

    // Then
    expect(result).toEqual(expect.any(String));
    expect(result).toHaveLength(10);
  });
});

describe("startNewTransaction", () => {
  let transport: Transport;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({});
  });
  afterAll(async () => {
    transport.close();
  });

  it("sends a correct sequence of APDU", async () => {
    // Given
    const exchange = new Exchange(transport, ExchangeTypes.Swap);

    // When
    const result = await exchange.startNewTransaction();

    // Then
    expect(result).toEqual(expect.any(String));
    expect(result).toHaveLength(10);
  });
});
