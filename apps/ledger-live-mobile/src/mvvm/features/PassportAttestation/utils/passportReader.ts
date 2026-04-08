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

/**
 * Read passport chip data via NFC with BAC authentication.
 *
 * Uses the MRZ-derived keys (document number, DOB, expiry) to perform
 * Basic Access Control handshake with the chip, then reads DG1.
 */
export async function readPassportNfc(mrzData: MrzData): Promise<PassportData> {
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
}

export async function cancelNfcScan(): Promise<void> {
  try {
    NfcPassportReader.stopReading();
  } catch {
    // stopReading is Android-only; ignore errors on iOS
  }
}
