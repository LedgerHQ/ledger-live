export class LatestFirmwareVersionRequired extends Error {
  override name = "LatestFirmwareVersionRequired";
  constructor(message?: string) {
    super(message ?? "LatestFirmwareVersionRequired");
  }
}

export class UpdateYourApp extends Error {
  override name = "UpdateYourApp";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "UpdateYourApp");
    if (fields) Object.assign(this, fields);
  }
}
