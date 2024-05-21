import axios from "axios";
import { TokenDataSource } from "./TokenDataSource";
import { HttpTokenDataSource } from "./HttpTokenDataSource";
import PACKAGE from "../../../package.json";

jest.mock("axios");

describe("HttpTokenDataSource", () => {
  let datasource: TokenDataSource;

  beforeAll(() => {
    datasource = new HttpTokenDataSource();
    jest.clearAllMocks();
  });

  it("should call axios with the ledger client version header", async () => {
    // GIVEN
    const version = `context-module/${PACKAGE.version}`;
    const requestSpy = jest.fn(() => Promise.resolve({ data: [] }));
    jest.spyOn(axios, "request").mockImplementation(requestSpy);

    // WHEN
    await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { "X-Ledger-Client-Version": version } }),
    );
  });
});
