import BigNumber from "bignumber.js";
import type { CosmosCoinConfig } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { getAccountInfo } from "./getAccountInfo";

const config = { denom: "uatom" } as CosmosCoinConfig;

function makeApi(redelegations: unknown[]): CosmosAPI {
  return {
    getRedelegationsWithQueued: jest.fn().mockResolvedValue(redelegations),
  } as unknown as CosmosAPI;
}

describe("logic/account/getAccountInfo", () => {
  it("reports the redelegations of the address in their JSON form, through the given API", async () => {
    const api = makeApi([
      {
        validatorSrcAddress: "cosmosvaloper1src",
        validatorDstAddress: "cosmosvaloper1dst",
        amount: new BigNumber("1000000"),
        completionDate: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        validatorSrcAddress: "cosmosvaloper1dst",
        validatorDstAddress: "cosmosvaloper1other",
        // Past BigNumber's exponent threshold: still a plain decimal string.
        amount: new BigNumber("123456789012345678901234"),
        completionDate: new Date("2026-02-01T12:30:00.000Z"),
      },
    ]);

    const info = await getAccountInfo(config, api, "cosmos", "cosmos1a");

    expect(api.getRedelegationsWithQueued).toHaveBeenCalledWith("cosmos1a", "uatom");
    expect(info).toEqual({
      type: "cosmos",
      redelegations: [
        {
          validatorSrcAddress: "cosmosvaloper1src",
          validatorDstAddress: "cosmosvaloper1dst",
          amount: "1000000",
          completionDate: "2026-01-01T00:00:00.000Z",
        },
        {
          validatorSrcAddress: "cosmosvaloper1dst",
          validatorDstAddress: "cosmosvaloper1other",
          amount: "123456789012345678901234",
          completionDate: "2026-02-01T12:30:00.000Z",
        },
      ],
    });
    expect(JSON.parse(JSON.stringify(info))).toStrictEqual(info);
  });

  it("reports no redelegation for an address without any", async () => {
    await expect(getAccountInfo(config, makeApi([]), "cosmos", "cosmos1a")).resolves.toEqual({
      type: "cosmos",
      redelegations: [],
    });
  });

  it("fails when the redelegations read fails", async () => {
    const api = {
      getRedelegationsWithQueued: jest.fn().mockRejectedValue(new Error("LCD down")),
    } as unknown as CosmosAPI;

    await expect(getAccountInfo(config, api, "cosmos", "cosmos1a")).rejects.toThrow("LCD down");
  });
});
