/**
 * Passport NFC reader using react-native-nfc-passport-reader.
 *
 * Reads the ePassport chip via NFC using Basic Access Control (BAC).
 * Extracts DG1 (MRZ data containing date of birth) from the chip.
 *
 * BAC requires three keys derived from the MRZ:
 * - Document number
 * - Date of birth (YYYY-MM-DD)
 * - Expiry date (YYYY-MM-DD)
 */
import NfcPassportReader from "react-native-nfc-passport-reader";
import type { MrzData } from "./mrzParser";

export type PassportData = {
  dateOfBirth: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  firstName: string;
  lastName: string;
  gender: string;
  mrz: string;
};

export async function isNfcSupported(): Promise<boolean> {
  return NfcPassportReader.isNfcSupported();
}

export async function isNfcEnabled(): Promise<boolean> {
  return NfcPassportReader.isNfcEnabled();
}

/**
 * Convert MRZ YYMMDD to YYYY-MM-DD for the BAC key.
 * Years 00-30 → 2000-2030, 31-99 → 1931-1999.
 */
function mrzDateToBacDate(yymmdd: string): string {
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const century = yy <= 30 ? 2000 : 1900;
  return `${century + yy}-${mm}-${dd}`;
}

function normalizePassportReaderError(error: unknown): Error {
  const rawMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Failed to read passport";
  const message = rawMessage.trim();
  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes("usercanceled") || lowerCaseMessage.includes("user canceled")) {
    return new Error("Passport NFC reading was cancelled.");
  }

  if (lowerCaseMessage.includes("nfcnotsupported") || lowerCaseMessage.includes("nfc not supported")) {
    return new Error("This iPhone does not support NFC passport scanning.");
  }

  if (lowerCaseMessage.includes("invalidmrzkey") || lowerCaseMessage.includes("invalid mrz")) {
    return new Error(
      "The passport chip rejected the MRZ details. Check the passport number, birth date, and expiry date.",
    );
  }

  if (lowerCaseMessage.includes("morethanonetagfound") || lowerCaseMessage.includes("more than one tag")) {
    return new Error("More than one NFC document was detected. Keep only the passport near the iPhone.");
  }

  if (lowerCaseMessage.includes("entitlement")) {
    return new Error(
      "This iOS build is missing the NFC Tag Reading capability required to scan passports. Reinstall a build signed with NFC passport entitlements.",
    );
  }

  if (message === "Error reading passport" || message === "Failed to read passport") {
    return new Error(
      "Unable to read the passport chip. Keep the top of the iPhone against the passport and make sure this iOS build has NFC Tag Reading enabled.",
    );
  }

  return new Error(message);
}

/**
 * Read passport chip data via NFC with BAC authentication.
 *
 * Uses the MRZ-derived keys (document number, DOB, expiry) to perform
 * Basic Access Control handshake with the chip, then reads DG1.
 */
export async function readPassportNfc(mrzData: MrzData): Promise<PassportData> {
  try {
    const result = await NfcPassportReader.startReading({
      bacKey: {
        documentNo: mrzData.documentNumber,
        birthDate: mrzDateToBacDate(mrzData.dateOfBirth),
        expiryDate: mrzDateToBacDate(mrzData.expiryDate),
      },
      includeImages: false,
    });

    return {
      dateOfBirth: result.birthDate,
      documentNumber: result.documentNo,
      nationality: result.nationality,
      expiryDate: result.expiryDate,
      firstName: result.firstName,
      lastName: result.lastName,
      gender: result.gender,
      mrz: result.mrz,
    };
  } catch (error) {
    throw normalizePassportReaderError(error);
  }
}

export async function cancelNfcScan(): Promise<void> {
  try {
    NfcPassportReader.stopReading();
  } catch {
    // stopReading is Android-only; ignore errors on iOS
  }
}
