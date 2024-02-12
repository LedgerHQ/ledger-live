import Transport from "@ledgerhq/hw-transport";
import { ChargingModes } from "@ledgerhq/types-devices";
import { BatteryStatusTypes } from "../../hw/getBatteryStatus";
import { getBatteryStatus } from "./getBatteryStatus";
import { firstValueFrom } from "rxjs";

const mockTransportGenerator = out =>
  ({
    send: () => new Promise(res => res(out)),
    on: () => {},
    off: () => {},
    setExchangeUnresponsiveTimeout: () => {},
  }) as unknown as Transport;

describe("getBatteryStatus", () => {
  test("battery percentage OK", async () => {
    const statusType = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const transport = mockTransportGenerator(Buffer.from("639000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );

    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(99);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery percentage KO returns -1", async () => {
    const statusType = BatteryStatusTypes.BATTERY_PERCENTAGE;
    const transport = mockTransportGenerator(Buffer.from("FF9000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(-1);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery voltage resolves", async () => {
    const statusType = BatteryStatusTypes.BATTERY_VOLTAGE;
    const transport = mockTransportGenerator(Buffer.from("0FFF9000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(4095);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery temperature with positive values", async () => {
    const statusType = BatteryStatusTypes.BATTERY_TEMPERATURE;
    const transport = mockTransportGenerator(Buffer.from("109000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(16);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery temperature with negative values", async () => {
    const statusType = BatteryStatusTypes.BATTERY_TEMPERATURE;
    const transport = mockTransportGenerator(Buffer.from("FD9000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(-3);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery current with positive values", async () => {
    const statusType = BatteryStatusTypes.BATTERY_CURRENT;
    const transport = mockTransportGenerator(Buffer.from("109000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(16);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery current with negative values", async () => {
    const statusType = BatteryStatusTypes.BATTERY_CURRENT;
    const transport = mockTransportGenerator(Buffer.from("FD9000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual(-3);
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery flags for USB charging", async () => {
    const statusType = BatteryStatusTypes.BATTERY_FLAGS;
    const transport = mockTransportGenerator(Buffer.from("0000000F9000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual({
        charging: ChargingModes.USB,
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      });
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery flags for not charging", async () => {
    const statusType = BatteryStatusTypes.BATTERY_FLAGS;
    const transport = mockTransportGenerator(Buffer.from("000000069000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual({
        charging: ChargingModes.NONE,
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      });
    } else {
      fail("Incorrect response event");
    }
  });

  test("battery flags for Qi charging without USB", async () => {
    const statusType = BatteryStatusTypes.BATTERY_FLAGS;
    const transport = mockTransportGenerator(Buffer.from("000000079000", "hex"));

    const response = await firstValueFrom(
      getBatteryStatus({
        transport,
        statusType,
      }),
    );
    if (response.type === "data") {
      expect(response.batteryStatus).toEqual({
        charging: ChargingModes.QI,
        issueCharging: false,
        issueTemperature: false,
        issueBattery: false,
      });
    } else {
      fail("Incorrect response event");
    }
  });
});
