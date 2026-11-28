export class SettingsPortMissing extends Error {
  override name = "SettingsPortMissing";

  constructor() {
    super("SettingsPortProvider is missing");
  }
}
