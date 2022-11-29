import getBatteryStatus, { BatteryStatusTypes } from "./getBatteryStatus";
import { ChargingModes } from "@ledgerhq/types-devices";

const mockTransportGenerator = (out) => ({ send: () => out });
describe("getBatteryStatus", () => {
  test("battery percentage OK", async () => {
    const p1 = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("639000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(99);
  });

  test("battery percentage KO returns -1", async () => {
    const p1 = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("FF9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(-1);
  });

  test("battery voltage resolves", async () => {
    const p1 = BatteryStatusTypes.BATTERY_VOLTAGE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("0FFF9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(4095);
  });

  test("battery temperature with positive values", async () => {
    const p1 = BatteryStatusTypes.BATTERY_TEMPERATURE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("109000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(16);
  });

  test("battery temperature with negative values", async () => {
    const p1 = BatteryStatusTypes.BATTERY_TEMPERATURE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("FD9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(-3);
  });

  test("battery current with positive values", async () => {
    const p1 = BatteryStatusTypes.BATTERY_CURRENT;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("109000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(16);
  });

  test("battery current with negative values", async () => {
    const p1 = BatteryStatusTypes.BATTERY_CURRENT;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("FD9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, p1);
    expect(response).toBe(-3);
  });

  test("battery flags if no parameter passed", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("000000009000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport);
    expect(response).not.toBeNull();
  });

  test("battery flags for healthy USB connection", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("0000000F9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport);
    expect(response).toMatchObject({
      charging: ChargingModes.USB,
      issueCharging: false,
      issueTemperature: false,
      issueBattery: false,
    });
  });

  test("battery flags for healthy BLE connection", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("000000069000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport);
    expect(response).toMatchObject({
      charging: ChargingModes.NONE,
      issueCharging: false,
      issueTemperature: false,
      issueBattery: false,
    });
  });
});
