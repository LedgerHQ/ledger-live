import {
  createPassportReviewForm,
  sanitizeDisplayDateInput,
  serializePassportReviewForm,
} from "./form";

const mrzData = {
  documentNumber: "23AT30794",
  dateOfBirth: "960114",
  expiryDate: "330325",
  nationality: "FRA",
  surname: "DOE",
  givenNames: "JOHN",
  sex: "M",
};

describe("passport confirm form helpers", () => {
  it("creates a review form from MRZ data", () => {
    expect(createPassportReviewForm(mrzData)).toEqual({
      documentNumber: "23AT30794",
      dateOfBirth: "14/01/1996",
      expiryDate: "25/03/2033",
    });
  });

  it("sanitizes and formats date input", () => {
    expect(sanitizeDisplayDateInput("14011996")).toBe("14/01/1996");
    expect(sanitizeDisplayDateInput("14-01-1996")).toBe("14/01/1996");
    expect(sanitizeDisplayDateInput("14011996123")).toBe("14/01/1996");
  });

  it("serializes edited fields back to MRZ data", () => {
    const result = serializePassportReviewForm(
      {
        documentNumber: "ab 1234",
        dateOfBirth: "14/01/1996",
        expiryDate: "25/03/2033",
      },
      mrzData,
    );

    expect(result).toEqual({
      ok: true,
      mrzData: {
        ...mrzData,
        documentNumber: "AB1234",
        dateOfBirth: "960114",
        expiryDate: "330325",
      },
    });
  });

  it("rejects invalid display dates", () => {
    expect(
      serializePassportReviewForm(
        {
          documentNumber: "AB1234",
          dateOfBirth: "31/02/1996",
          expiryDate: "25/03/2033",
        },
        mrzData,
      ),
    ).toEqual({
      ok: false,
      field: "dateOfBirth",
    });
  });
});
