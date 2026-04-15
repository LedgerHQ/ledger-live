import { emptyMrzData, sanitizeMrzDataForConfirmation } from "./form";

describe("scan MRZ form helpers", () => {
  it("preserves scanned identity fields while sanitizing editable MRZ fields", () => {
    expect(
      sanitizeMrzDataForConfirmation({
        documentNumber: " ab12345 ",
        dateOfBirth: "90/01/15",
        expiryDate: "30-12-31",
        nationality: "FRA",
        surname: "DOE",
        givenNames: "JOHN JAMES",
        sex: "M",
      }),
    ).toEqual({
      documentNumber: "AB12345",
      dateOfBirth: "900115",
      expiryDate: "301231",
      nationality: "FRA",
      surname: "DOE",
      givenNames: "JOHN JAMES",
      sex: "M",
    });
  });

  it("falls back to default optional passport values", () => {
    expect(
      sanitizeMrzDataForConfirmation({
        ...emptyMrzData,
        documentNumber: "AB12345",
        dateOfBirth: "900115",
        expiryDate: "301231",
      }),
    ).toEqual({
      ...emptyMrzData,
      documentNumber: "AB12345",
      dateOfBirth: "900115",
      expiryDate: "301231",
    });
  });
});
