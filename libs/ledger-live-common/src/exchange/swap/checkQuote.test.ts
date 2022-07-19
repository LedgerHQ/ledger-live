import axios from "axios";
import checkQuote from "./checkQuote";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

const provider = "changelly";
const quoteId = "RATE_ID";
const bearerToken = "BEARER_TOKEN";

describe("swap/checkQuote", () => {
  test("should return response in case of valid rate", async () => {
    const data = {
      code: 1,
      codeName: "RATE_VALID",
      description: "KYC check passed",
    };

    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    const res = await checkQuote({ provider, quoteId, bearerToken });

    expect(res).toEqual(data);
  });

  test("should return response in case of invalid rate", async () => {
    const data = {
      code: 204,
      codeName: "MFA_REQUIRED",
      description: "MFA Required",
    };

    const resp = {
      data,
      status: 200,
      statusText: "",
      headers: {},
      config: {},
    };

    mockedAxios.mockResolvedValue(Promise.resolve(resp));
    const res = await checkQuote({ provider, quoteId, bearerToken });

    expect(res).toEqual(data);
  });
});
