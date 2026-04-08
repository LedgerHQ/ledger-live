import {
  parseMrz,
  validateCheckDigit,
  mrzDateToFullDate,
  computeMrzHash,
} from "../utils/mrzParser";

describe("mrzParser", () => {
  // Standard TD3 MRZ example (ICAO Doc 9303 test data)
  const validMrz =
    "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<" +
    "L898902C36UTO7408122F1204159ZE184226B<<<<<<1";

  describe("parseMrz", () => {
    it("should parse a valid TD3 MRZ", () => {
      const result = parseMrz(validMrz);
      expect(result).not.toBeNull();
      expect(result!.documentNumber).toBe("L898902C3");
      expect(result!.nationality).toBe("UTO");
      expect(result!.dateOfBirth).toBe("740812");
      expect(result!.expiryDate).toBe("120415");
      expect(result!.surname).toBe("ERIKSSON");
      expect(result!.givenNames).toContain("ANNA");
      expect(result!.sex).toBe("F");
    });

    it("should return null for empty input", () => {
      expect(parseMrz("")).toBeNull();
    });

    it("should return null for too-short input", () => {
      expect(parseMrz("P<UTOERIKSSON")).toBeNull();
    });

    it("should return null if line 1 doesn't start with P", () => {
      const invalid = "X<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<" + "L898902C36UTO7408122F1204159ZE184226B<<<<<<1";
      expect(parseMrz(invalid)).toBeNull();
    });
  });

  describe("validateCheckDigit", () => {
    it("should validate a correct check digit", () => {
      expect(validateCheckDigit("L898902C3", "6")).toBe(true);
    });

    it("should reject an incorrect check digit", () => {
      expect(validateCheckDigit("L898902C3", "5")).toBe(false);
    });
  });

  describe("mrzDateToFullDate", () => {
    it("should convert 00-30 to 2000-2030", () => {
      expect(mrzDateToFullDate("050115")).toBe(20050115);
      expect(mrzDateToFullDate("300101")).toBe(20300101);
    });

    it("should convert 31-99 to 1931-1999", () => {
      expect(mrzDateToFullDate("900101")).toBe(19900101);
      expect(mrzDateToFullDate("740812")).toBe(19740812);
      expect(mrzDateToFullDate("991231")).toBe(19991231);
    });
  });

  describe("computeMrzHash", () => {
    it("should produce a deterministic hash", () => {
      const data = {
        documentNumber: "L898902C3",
        dateOfBirth: "740812",
        expiryDate: "120415",
        nationality: "UTO",
        surname: "ERIKSSON",
        givenNames: "ANNA MARIA",
        sex: "F",
      };

      const hash1 = computeMrzHash(data);
      const hash2 = computeMrzHash(data);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBeGreaterThanOrEqual(8);
    });

    it("should produce different hashes for different passports", () => {
      const data1 = {
        documentNumber: "L898902C3",
        dateOfBirth: "740812",
        expiryDate: "120415",
        nationality: "UTO",
        surname: "A",
        givenNames: "B",
        sex: "M",
      };
      const data2 = {
        documentNumber: "X123456Y7",
        dateOfBirth: "900101",
        expiryDate: "301231",
        nationality: "FRA",
        surname: "C",
        givenNames: "D",
        sex: "F",
      };

      expect(computeMrzHash(data1)).not.toBe(computeMrzHash(data2));
    });
  });
});
