export class IconAllFundsWarning extends Error {
  override name = "IconAllFundsWarning";
  constructor(message = "IconAllFundsWarning") {
    super(message);
  }
}
export class IconValidatorsRequired extends Error {
  override name = "IconValidatorsRequired";
  constructor(message = "IconValidatorsRequired") {
    super(message);
  }
}
export class IconDoMaxSendInstead extends Error {
  override name = "IconDoMaxSendInstead";
  constructor(message = "IconDoMaxSendInstead", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
