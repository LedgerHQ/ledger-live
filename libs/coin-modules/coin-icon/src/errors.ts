export class IconAllFundsWarning extends Error {
  override name = "IconAllFundsWarning";
}
export class IconValidatorsRequired extends Error {
  override name = "IconValidatorsRequired";
}
export class IconDoMaxSendInstead extends Error {
  override name = "IconDoMaxSendInstead";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
