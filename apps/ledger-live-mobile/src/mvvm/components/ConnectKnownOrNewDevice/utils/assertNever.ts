export function assertNever(value: never): never {
  throw new Error(`Unhandled connect known or new device state: ${JSON.stringify(value)}`);
}
