import type { AppState } from "./app";

export function interruptionErrorOf(
  inWrongDeviceForAccount: AppState["inWrongDeviceForAccount"],
  error: unknown,
): Error {
  if (inWrongDeviceForAccount) {
    return Object.assign(new Error("Wrong device for account"), { name: "WrongDeviceForAccount" });
  }

  if (error instanceof Error) return error;

  return Object.assign(new Error("Device disconnected"), {
    name: "DisconnectedDeviceDuringOperation",
  });
}
