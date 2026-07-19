export class IconAllFundsWarning extends Error {
  override name = "IconAllFundsWarning";
  constructor(message?: string) {
    super(message ?? "IconAllFundsWarning");
  }
}
export class IconValidatorsRequired extends Error {
  override name = "IconValidatorsRequired";
  constructor(message?: string) {
    super(message ?? "IconValidatorsRequired");
  }
}
export class IconDoMaxSendInstead extends Error {
  override name = "IconDoMaxSendInstead";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "IconDoMaxSendInstead");
    if (fields) Object.assign(this, fields);
  }
}
