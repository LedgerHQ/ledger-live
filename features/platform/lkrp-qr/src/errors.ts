export class LkrpQrNotImplementedError extends Error {
  override name = "LkrpQrNotImplementedError";

  constructor(role: "host" | "candidate") {
    super(`LKRP QR ${role} pairing is not implemented`);
  }
}

export class ScannedOldImportQrCode extends Error {
  override name = "ScannedOldImportQrCode";
}

export class ScannedNewImportQrCode extends Error {
  override name = "ScannedNewImportQrCode";
}

export class ScannedInvalidQrCode extends Error {
  override name = "ScannedInvalidQrCode";
}

export class InvalidDigitsError extends Error {
  override name = "InvalidDigitsError";
}

export class QRCodeWSClosed extends Error {
  override name = "QRCodeWSClosed";
  readonly time?: number;

  constructor(message?: string, time?: number) {
    super(message ?? "QRCodeWSClosed");
    this.time = time;
  }
}

export class QRCodeProtocolError extends Error {
  override name = "QRCodeProtocolError";
}
