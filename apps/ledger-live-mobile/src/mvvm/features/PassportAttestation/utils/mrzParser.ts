/**
 * MRZ (Machine Readable Zone) parser for TD3 travel documents (passports).
 *
 * Extracts BAC keys (document number, date of birth, expiry date) needed
 * to unlock the NFC chip via Basic Access Control.
 *
 * TD3 format: two lines of 44 characters each.
 * Line 1: P<ISSUING_COUNTRY<SURNAME<<GIVEN_NAMES<<...
 * Line 2: DOC_NUMBER<CHECK<NATIONALITY<DOB<CHECK<SEX<EXPIRY<CHECK<OPTIONAL<CHECK<COMPOSITE_CHECK
 */

export type MrzData = {
  documentNumber: string;
  dateOfBirth: string; // YYMMDD
  expiryDate: string; // YYMMDD
  nationality: string;
  surname: string;
  givenNames: string;
  sex: string;
};

const MRZ_LINE_LENGTH = 44;
const FILLER = /</g;

function cleanField(raw: string): string {
  return raw.replace(FILLER, " ").trim();
}

function checkDigit(input: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    let value: number;
    if (ch === "<") {
      value = 0;
    } else if (ch >= "0" && ch <= "9") {
      value = parseInt(ch, 10);
    } else {
      value = ch.charCodeAt(0) - "A".charCodeAt(0) + 10;
    }
    sum += value * weights[i % 3];
  }
  return sum % 10;
}

export function validateCheckDigit(data: string, expected: string): boolean {
  return checkDigit(data) === parseInt(expected, 10);
}

export function parseMrz(raw: string): MrzData | null {
  const lines = raw
    .replace(/\n/g, "")
    .replace(/\s+/g, "")
    .trim();

  if (lines.length < MRZ_LINE_LENGTH * 2) {
    return null;
  }

  const line1 = lines.substring(0, MRZ_LINE_LENGTH);
  const line2 = lines.substring(MRZ_LINE_LENGTH, MRZ_LINE_LENGTH * 2);

  if (!line1.startsWith("P")) {
    return null;
  }

  const nameField = line1.substring(5);
  const nameParts = nameField.split("<<");
  const surname = cleanField(nameParts[0] || "");
  const givenNames = cleanField(nameParts.slice(1).join(" "));

  const documentNumber = line2.substring(0, 9).replace(FILLER, "");
  const docCheckDigit = line2[9];
  const nationality = line2.substring(10, 13).replace(FILLER, "");
  const dateOfBirth = line2.substring(13, 19);
  const dobCheckDigit = line2[19];
  const sex = line2[20];
  const expiryDate = line2.substring(21, 27);
  const expiryCheckDigit = line2[27];

  if (
    !validateCheckDigit(line2.substring(0, 9), docCheckDigit) ||
    !validateCheckDigit(dateOfBirth, dobCheckDigit) ||
    !validateCheckDigit(expiryDate, expiryCheckDigit)
  ) {
    return null;
  }

  return {
    documentNumber,
    dateOfBirth,
    expiryDate,
    nationality,
    surname,
    givenNames,
    sex,
  };
}

/**
 * Lenient MRZ parser that skips check digit validation.
 * Used as a fallback when OCR introduces small character errors
 * that break check digits but the field positions are correct.
 */
export function parseMrzLenient(raw: string): MrzData | null {
  const lines = raw
    .replace(/\n/g, "")
    .replace(/\s+/g, "")
    .trim();

  if (lines.length < MRZ_LINE_LENGTH * 2) {
    return null;
  }

  const line1 = lines.substring(0, MRZ_LINE_LENGTH);
  const line2 = lines.substring(MRZ_LINE_LENGTH, MRZ_LINE_LENGTH * 2);

  if (!line1.startsWith("P")) {
    return null;
  }

  const nameField = line1.substring(5);
  const nameParts = nameField.split("<<");
  const surname = cleanField(nameParts[0] || "");
  const givenNames = cleanField(nameParts.slice(1).join(" "));

  const documentNumber = line2.substring(0, 9).replace(FILLER, "");
  const nationality = line2.substring(10, 13).replace(FILLER, "");
  const dateOfBirth = line2.substring(13, 19);
  const sex = line2[20];
  const expiryDate = line2.substring(21, 27);

  // Basic sanity: DOB and expiry should be 6 digits
  if (!/^\d{6}$/.test(dateOfBirth) || !/^\d{6}$/.test(expiryDate)) {
    return null;
  }

  return {
    documentNumber,
    dateOfBirth,
    expiryDate,
    nationality,
    surname,
    givenNames,
    sex,
  };
}

/**
 * Convert YYMMDD to a full YYYYMMDD integer.
 * Years 00-30 are interpreted as 2000-2030, 31-99 as 1931-1999.
 */
export function mrzDateToFullDate(yymmdd: string): number {
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const century = yy <= 30 ? 2000 : 1900;
  return parseInt(`${century + yy}${mm}${dd}`, 10);
}

/**
 * Compute the MRZ hash used to bind ZK proofs to a specific passport.
 * Uses a simple deterministic hash from document number + DOB + expiry.
 */
export function computeMrzHash(data: MrzData): string {
  const input = `${data.documentNumber}:${data.dateOfBirth}:${data.expiryDate}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
