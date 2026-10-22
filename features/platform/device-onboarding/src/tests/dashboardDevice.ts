import {
  CommandResultFactory,
  DeviceModelId,
  GetOsVersionCommand,
} from "@ledgerhq/device-management-kit";

/**
 * What a real device does with the commands the machine sends on its own, whatever the test
 * scripts: it tells its open app (BOLOS on the dashboard), closing the app goes back to the
 * dashboard, and an open app refuses the OS version command. A fake asks it first and plays its
 * own script only when it returns `undefined`.
 */
export type DashboardDevice = {
  openApp(name: string): void;
  answer(command: object): Promise<unknown> | undefined;
};

export function createDashboardDevice(): DashboardDevice {
  let openApp: string | null = null;

  return {
    openApp(name) {
      openApp = name;
    },
    answer(command) {
      const name = commandName(command);

      if (name === "getAppAndVersion") {
        return Promise.resolve(
          CommandResultFactory({ data: { name: openApp ?? "BOLOS", version: "1.0.0" } }),
        );
      }

      if (name === "closeApp") {
        openApp = null;
        return Promise.resolve(CommandResultFactory({ data: undefined }));
      }

      if (name === "getOsVersion" && openApp !== null) {
        return Promise.resolve(appRefusal());
      }

      return undefined;
    },
  };
}

/** The commands a fake `sendCommand` received, by name, in order. */
export function commandNames(sendCommand: jest.Mock): string[] {
  return sendCommand.mock.calls.map(([{ command }]) => commandName(command));
}

/** By name, not class: a test can load two copies of DMK, so `instanceof` may miss. */
function commandName(command: object): string {
  return "name" in command && typeof command.name === "string" ? command.name : "";
}

/** What an open app answers to a dashboard command: CLA not supported. */
function appRefusal() {
  return new GetOsVersionCommand().parseResponse(
    { statusCode: Uint8Array.of(0x6e, 0x00), data: new Uint8Array() },
    DeviceModelId.STAX,
  );
}
