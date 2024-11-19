import axios from "axios";
import PACKAGE from "../../../package.json";
import { NftDataSource } from "./NftDataSource";
import { HttpNftDataSource } from "./HttpNftDataSource";

jest.mock("axios");

describe("HttpNftDataSource", () => {
  let datasource: NftDataSource;

  beforeAll(() => {
    datasource = new HttpNftDataSource();
    jest.clearAllMocks();
  });

  it("should call axios with the ledger client version header", async () => {
    // GIVEN
    const version = `context-module/${PACKAGE.version}`;
    const requestSpy = jest.fn(() => Promise.resolve({ data: [] }));
    jest.spyOn(axios, "request").mockImplementation(requestSpy);

    // WHEN
    await datasource.getNftInfosPayload({ address: "0x00", chainId: 1 });
    await datasource.getSetPluginPayload({ address: "0x00", chainId: 1, selector: "0x00" });

    // THEN
    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ headers: { "X-Ledger-Client-Version": version } }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ headers: { "X-Ledger-Client-Version": version } }),
    );
  });

  describe("getNftInfosPayload", () => {
    it("should return undefined when axios throws an error", async () => {
      // GIVEN
      jest.spyOn(axios, "request").mockRejectedValue(new Error("error"));

      // WHEN
      const result = await datasource.getNftInfosPayload({ address: "0x00", chainId: 1 });

      // THEN
      expect(result).toBeUndefined();
    });
  });

  describe("getSetPluginPayload", () => {
    it("should return undefined when axios throws an error", async () => {
      // GIVEN
      jest.spyOn(axios, "request").mockRejectedValue(new Error("error"));

      // WHEN
      const result = await datasource.getSetPluginPayload({
        address: "0x00",
        chainId: 1,
        selector: "0x00",
      });

      // THEN
      expect(result).toBeUndefined();
    });
  });
});
