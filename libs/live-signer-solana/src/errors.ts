export class LatestFirmwareVersionRequired extends Error {
  override name = "LatestFirmwareVersionRequired";
}

export class UpdateYourApp extends Error {
  override name = "UpdateYourApp";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
