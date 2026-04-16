import type { MrzData } from "../../utils/mrzParser";

export type PassportReviewForm = {
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
};

export type PassportReviewSubmitResult =
  | {
      ok: true;
      mrzData: MrzData;
    }
  | {
      ok: false;
      field: keyof PassportReviewForm;
    };

function parseDisplayDate(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 8) {
    return null;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year % 100).padStart(2, "0")}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

export function sanitizeDisplayDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatMrzDateForDisplay(value: string, kind: "birth" | "expiry" = "birth") {
  if (!/^\d{6}$/.test(value)) {
    return value;
  }

  const year = Number(value.slice(0, 2));
  const month = value.slice(2, 4);
  const day = value.slice(4, 6);
  const century = kind === "expiry" ? 2000 : year <= 30 ? 2000 : 1900;

  return `${day}/${month}/${century + year}`;
}

export function createPassportReviewForm(mrzData: MrzData): PassportReviewForm {
  return {
    documentNumber: mrzData.documentNumber,
    dateOfBirth: formatMrzDateForDisplay(mrzData.dateOfBirth, "birth"),
    expiryDate: formatMrzDateForDisplay(mrzData.expiryDate, "expiry"),
  };
}

export function serializePassportReviewForm(
  form: PassportReviewForm,
  mrzData: MrzData,
): PassportReviewSubmitResult {
  const documentNumber = form.documentNumber.toUpperCase().replace(/\s+/g, "");
  const dateOfBirth = parseDisplayDate(form.dateOfBirth);
  const expiryDate = parseDisplayDate(form.expiryDate);

  if (!documentNumber) {
    return {
      ok: false,
      field: "documentNumber",
    };
  }

  if (!dateOfBirth) {
    return {
      ok: false,
      field: "dateOfBirth",
    };
  }

  if (!expiryDate) {
    return {
      ok: false,
      field: "expiryDate",
    };
  }

  return {
    ok: true,
    mrzData: {
      ...mrzData,
      documentNumber,
      dateOfBirth,
      expiryDate,
    },
  };
}
