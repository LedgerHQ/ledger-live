import type { MrzData } from "../../utils/mrzParser";

export const emptyMrzData: MrzData = {
  documentNumber: "",
  dateOfBirth: "",
  expiryDate: "",
  nationality: "N/A",
  surname: "",
  givenNames: "",
  sex: "X",
};

export function sanitizeMrzDataForConfirmation(mrzData: MrzData): MrzData {
  return {
    ...mrzData,
    documentNumber: mrzData.documentNumber.trim().toUpperCase(),
    dateOfBirth: mrzData.dateOfBirth.trim().replace(/\//g, "").replace(/-/g, ""),
    expiryDate: mrzData.expiryDate.trim().replace(/\//g, "").replace(/-/g, ""),
    nationality: mrzData.nationality || "N/A",
    sex: mrzData.sex || "X",
  };
}
