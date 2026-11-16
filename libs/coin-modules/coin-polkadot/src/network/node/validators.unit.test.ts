import { polkadotMainnetConfigValue } from "../../test/config.fixture";
import getApiPromise from "./apiPromise";
import { fetchValidators } from "./validators";

jest.mock("./apiPromise", () => jest.fn());

const asCodec = (value: string) => ({ toString: () => value });
const blockedValidator = "blockedValidator";

describe("fetchValidators", () => {
  const registeredElected = "registeredElected";
  const registeredWaiting = "registeredWaiting";
  const unregisteredInSession = "unregisteredInSession";

  beforeEach(() => {
    const api = {
      query: {
        staking: {
          activeEra: jest.fn().mockResolvedValue({
            unwrapOrDefault: () => ({ index: "activeEra" }),
          }),
          validators: {
            multi: jest.fn().mockImplementation(async (ids: string[]) => {
              return ids.map(id => ({
                commission: asCodec("0"),
                blocked: { isTrue: id === blockedValidator },
              }));
            }),
          },
          erasStakersOverview: {
            multi: jest.fn().mockImplementation(async (queries: string[][]) => {
              return queries.map(() => ({ isSome: false }));
            }),
          },
        },
        session: {
          validators: jest
            .fn()
            .mockResolvedValue([asCodec(registeredElected), asCodec(unregisteredInSession)]),
        },
      },
      derive: {
        staking: {
          stashes: jest
            .fn()
            .mockResolvedValue([
              asCodec(registeredElected),
              asCodec(registeredWaiting),
              asCodec(blockedValidator),
            ]),
        },
      },
      consts: { staking: { maxExposurePageSize: { toNumber: () => 512 } } },
    };
    (getApiPromise as jest.Mock).mockResolvedValue(api);
  });

  it("excludes session validators missing from the staking validators from the elected list", async () => {
    const result = await fetchValidators(polkadotMainnetConfigValue, "elected");

    expect(result.map(v => v.accountId)).toEqual([registeredElected]);
  });

  it("excludes session validators missing from the staking validators from the all list", async () => {
    const result = await fetchValidators(polkadotMainnetConfigValue, "all");

    expect(result.map(v => v.accountId)).toEqual([
      registeredElected,
      registeredWaiting,
      blockedValidator,
    ]);
  });

  it("does not return an unregistered validator when asked by address", async () => {
    const result = await fetchValidators(polkadotMainnetConfigValue, "all", [
      unregisteredInSession,
      registeredWaiting,
    ]);

    expect(result.map(v => v.accountId)).toEqual([registeredWaiting]);
  });

  it("flags registered session validators as elected and the others as waiting", async () => {
    const result = await fetchValidators(polkadotMainnetConfigValue, "all");

    expect(result.map(v => [v.accountId, v.isElected])).toEqual([
      [registeredElected, true],
      [registeredWaiting, false],
      [blockedValidator, false],
    ]);
  });

  it("flags blocked validators", async () => {
    const result = await fetchValidators(polkadotMainnetConfigValue, "all");

    expect(result.map(v => [v.accountId, v.isBlocked])).toEqual([
      [registeredElected, false],
      [registeredWaiting, false],
      [blockedValidator, true],
    ]);
  });
});
