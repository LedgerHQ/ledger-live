import getBatteryStatus, { BatteryStatusTypes } from "./getBatteryStatus";
import { ChargingModes } from "@ledgerhq/types-devices";

const mockTransportGenerator = (out) => ({ send: () => out });
describe("getBatteryStatus", () => {
  test("battery percentage OK", async () => {
    const p2 = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("639000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([99]);
  });

  test("battery percentage KO returns -1", async () => {
    const p2 = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("FF9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([-1]);
  });

  test("battery voltage resolves", async () => {
    const p2 = BatteryStatusTypes.BATTERY_VOLTAGE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("0FFF9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([4095]);
  });

  test("battery temperature with positive values", async () => {
    const p2 = BatteryStatusTypes.BATTERY_TEMPERATURE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("109000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([16]);
  });

  test("battery temperature with negative values", async () => {
    const p2 = BatteryStatusTypes.BATTERY_TEMPERATURE;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("FD9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([-3]);
  });

  test("battery current with positive values", async () => {
    const p2 = BatteryStatusTypes.BATTERY_CURRENT;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("109000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([16]);
  });

  test("battery current with negative values", async () => {
    const p2 = BatteryStatusTypes.BATTERY_CURRENT;
    const mockedTransport = mockTransportGenerator(
      Buffer.from("FD9000", "hex")
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([-3]);
  });

  test("battery flags for USB charging", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("0000000F9000", "hex")
    );

    const p2 = BatteryStatusTypes.BATTERY_FLAGS;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([
      {
        charging: ChargingModes.USB,
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      },
    ]);
  });

  test("battery flags for not charging", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("000000069000", "hex")
    );

    const p2 = BatteryStatusTypes.BATTERY_FLAGS;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([
      {
        charging: ChargingModes.NONE,
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      },
    ]);
  });

  test("battery flags for Qi charging without USB", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("000000079000", "hex")
    );

    const p2 = BatteryStatusTypes.BATTERY_FLAGS;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([
      {
        charging: ChargingModes.QI,
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      },
    ]);
  });

  test("battery flags for Qi charging with USB plugged in", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from("0000000F9000", "hex")
    );

    const p2 = BatteryStatusTypes.BATTERY_FLAGS;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(mockedTransport, [p2]);
    expect(response).toEqual([
      {
        charging: ChargingModes.USB, // USB takes over
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      },
    ]);
  });

  test("multiple statuses: percentage + battery flags for Qi charging with USB plugged in", async () => {
    let calls = 0;
    const multipleStatusMockedTransport = {
      send: () => {
        if (calls === 0) {
          calls++;
          return Buffer.from("0000000F9000", "hex");
        }

        return Buffer.from("639000", "hex");
      },
    };

    const percentage = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const flags = BatteryStatusTypes.BATTERY_FLAGS;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore next-line
    const response = await getBatteryStatus(multipleStatusMockedTransport, [
      flags,
      percentage,
    ]);
    expect(response).toEqual([
      {
        charging: ChargingModes.USB, // USB takes over
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      },
      99,
    ]);
  });
});
