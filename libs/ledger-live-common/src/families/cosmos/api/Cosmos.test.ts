import BigNumber from "bignumber.js";
import { CosmosAPI } from "./Cosmos";
import network from "../../../network";
jest.mock("../../../network");

describe("CosmosApi", () => {
  let cosmosApi: CosmosAPI;
  describe("simulate", () => {
    beforeEach(() => {
      cosmosApi = new CosmosAPI("cosmos");
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    describe("when the network call returns gas used", () => {
      beforeEach(() => {
        // @ts-expect-error method is mocked
        network.mockResolvedValue({
          data: {
            gas_info: {
              gas_used: 42000,
            },
          },
        });
      });
      it("should return gas used", async () => {
        const gas = await cosmosApi.simulate([]);
        expect(gas).toEqual(new BigNumber(42000));
      });
    });

    describe("when the network call does not return gas used", () => {
      beforeEach(() => {
        // @ts-expect-error method is mocked
        network.mockResolvedValue({
          data: { gas_info: {} },
        });
      });
      it("should throw an error", async () => {
        await expect(cosmosApi.simulate([])).rejects.toThrowError();
      });
    });

    describe("when the network call fails", () => {
      beforeEach(() => {
        // @ts-expect-error method is mocked
        network.mockImplementation(() => {
          throw new Error();
        });
      });
      it("should throw an error", async () => {
        await expect(cosmosApi.simulate([])).rejects.toThrowError();
      });
    });
  });
});
