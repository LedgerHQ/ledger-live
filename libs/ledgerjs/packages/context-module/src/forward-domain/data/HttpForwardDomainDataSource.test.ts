import axios from "axios";
import PACKAGE from "../../../package.json";
import { ForwardDomainDataSource } from "./ForwardDomainDataSource";
import { HttpForwardDomainDataSource } from "./HttpForwardDomainDataSource";

jest.mock("axios");

describe("HttpForwardDomainDataSource", () => {
  let datasource: ForwardDomainDataSource;

  beforeAll(() => {
    datasource = new HttpForwardDomainDataSource();
    jest.clearAllMocks();
  });

  it("should call axios with the ledger client version header", async () => {
    // GIVEN
    const version = `context-module/${PACKAGE.version}`;
    const requestSpy = jest.fn(() => Promise.resolve({ data: [] }));
    jest.spyOn(axios, "request").mockImplementation(requestSpy);

    // WHEN
    await datasource.getDomainNamePayload({ challenge: "", domain: "hello.eth" });

    // THEN
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { "X-Ledger-Client-Version": version } }),
    );
  });
});
