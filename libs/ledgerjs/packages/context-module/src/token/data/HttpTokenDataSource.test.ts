import axios from "axios";
import { TokenDataSource } from "./TokenDataSource";
import { HttpTokenDataSource } from "./HttpTokenDataSource";
import { TokenDto } from "./TokenDto";
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

  it("should return a string when axios response is correct", async () => {
    // GIVEN
    const tokenDTO: TokenDto = { live_signature: "0x0", decimals: 8, ticker: "USDC" };
    jest.spyOn(axios, "request").mockResolvedValue({ data: [tokenDTO] });

    // WHEN
    const result = await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(result).toEqual("0455534443000000000800000001");
  });

  it("should return undefined when data is empty", async () => {
    // GIVEN
    jest.spyOn(axios, "request").mockResolvedValue({ data: undefined });

    // WHEN
    const result = await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(result).toEqual(undefined);
  });

  it("should return undefined when no signature", async () => {
    // GIVEN
    jest.spyOn(axios, "request").mockResolvedValue({ data: [{}] });

    // WHEN
    const result = await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(result).toEqual(undefined);
  });

  it("should return undefined when no ticker", async () => {
    // GIVEN
    jest.spyOn(axios, "request").mockResolvedValue({ data: [{ live_signature: "0x0" }] });

    // WHEN
    const result = await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(result).toEqual(undefined);
  });

  it("should return undefined when no decimals", async () => {
    // GIVEN
    jest
      .spyOn(axios, "request")
      .mockResolvedValue({ data: [{ live_signature: "0x0", ticker: "USDC" }] });

    // WHEN
    const result = await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(result).toEqual(undefined);
  });

  it("should return undefined when axios throws an error", async () => {
    // GIVEN
    jest.spyOn(axios, "request").mockRejectedValue(new Error());

    // WHEN
    const result = await datasource.getTokenInfosPayload({ address: "0x00", chainId: 1 });

    // THEN
    expect(result).toEqual(undefined);
  });
});
