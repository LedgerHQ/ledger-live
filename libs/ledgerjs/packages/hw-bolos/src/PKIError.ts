const ErrorCode = {
  0x422f: "Incorrect structure type",
  0x4230: "Incorrect certificate version",
  0x4231: "Incorrect certificate validity",
  0x4232: "Incorrect certificate validity index",
  0x4233: "Unknown signer key ID",
  0x4234: "Unknown signature algorithm",
  0x4235: "Unknown public key ID",
  0x4236: "Unknown public key usage",
  0x4237: "Incorrect elliptic curve ID",
  0x4238: "Incorrect signature algorithm associated to the public key",
  0x4239: "Unknown target device",
  0x422d: "Unknown certificate tag",
  0x3301: "Failed to hash data",
  0x422e: "expected_key_usage doesn't match certificate key usage",
  0x5720: "Failed to verify signature",
  0x4118: "trusted_name buffer is too small to contain the trusted name",
};

export function mapCodeToError(code: number): PKIError {
  switch (code) {
    case 0x422f:
      return new PKIStructError();
    case 0x4230:
      return new PKICertificateVersionError();
    case 0x4231:
      return new PKICertificateValidityError();
    case 0x4232:
      return new PKICertificateIndexError();
    case 0x4233:
      return new PKIUnknownSignerIdError();
    case 0x4234:
      return new PKIUnknownSignerAlgorithmError();
    case 0x4235:
      return new PKIUnknownPublicIdError();
    case 0x4236:
      return new PKIUnknownPublicUsageError();
    case 0x4237:
      return new PKIIncorrectCurveError();
    case 0x4238:
      return new PKIIncorrectSignatureError();
    case 0x4239:
      return new PKIUnknownDeviceError();
    case 0x422d:
      return new PKIUnknownCertificateTagError();
    case 0x3301:
      return new PKIFailedHashError();
    case 0x422e:
      return new PKIMismatchKeyError();
    case 0x5720:
      return new PKIFailedVerificationError();
    case 0x4118:
      return new PKITrustedNameTooSmallError();
    default:
      return new PKIError("Unknown");
  }
}

export class PKIError extends Error {
  constructor(cause: string) {
    super("PKIError due to " + cause);
  }
}
export class PKIStructError extends PKIError {
  constructor() {
    super(ErrorCode[0x422f]);
  }
}
export class PKICertificateVersionError extends PKIError {
  constructor() {
    super(ErrorCode[0x4230]);
  }
}
export class PKICertificateValidityError extends PKIError {
  constructor() {
    super(ErrorCode[0x4231]);
  }
}
export class PKICertificateIndexError extends PKIError {
  constructor() {
    super(ErrorCode[0x4232]);
  }
}
export class PKIUnknownSignerIdError extends PKIError {
  constructor() {
    super(ErrorCode[0x4233]);
  }
}
export class PKIUnknownSignerAlgorithmError extends PKIError {
  constructor() {
    super(ErrorCode[0x4234]);
  }
}
export class PKIUnknownPublicIdError extends PKIError {
  constructor() {
    super(ErrorCode[0x4235]);
  }
}
export class PKIUnknownPublicUsageError extends PKIError {
  constructor() {
    super(ErrorCode[0x4236]);
  }
}
export class PKIIncorrectCurveError extends PKIError {
  constructor() {
    super(ErrorCode[0x4237]);
  }
}
export class PKIIncorrectSignatureError extends PKIError {
  constructor() {
    super(ErrorCode[0x4238]);
  }
}
export class PKIUnknownDeviceError extends PKIError {
  constructor() {
    super(ErrorCode[0x4239]);
  }
}
export class PKIUnknownCertificateTagError extends PKIError {
  constructor() {
    super(ErrorCode[0x422d]);
  }
}
export class PKIFailedHashError extends PKIError {
  constructor() {
    super(ErrorCode[0x3301]);
  }
}
export class PKIMismatchKeyError extends PKIError {
  constructor() {
    super(ErrorCode[0x422e]);
  }
}
export class PKIFailedVerificationError extends PKIError {
  constructor() {
    super(ErrorCode[0x5720]);
  }
}
export class PKITrustedNameTooSmallError extends PKIError {
  constructor() {
    super(ErrorCode[0x4118]);
  }
}
