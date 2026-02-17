import getApiPromise from "./apiPromise";
import { fetchNominations } from "./nominations";

jest.mock("./apiPromise", () => jest.fn());

describe("fetchNominations", () => {
  let api: any;
  const mockAddress = "mockAddress";

  beforeEach(() => {
    api = {
      rpc: {
        chain: {
          getFinalizedHead: jest.fn(),
        },
      },
      query: {
        staking: {
          activeEra: {
            at: jest.fn(),
          },
          nominators: {
            at: jest.fn(),
          },
          erasStakersOverview: {
            multi: jest.fn(),
          },
          erasStakersPaged: jest.fn(),
        },
      },
      derive: {
        staking: {
          stashes: jest.fn(),
        },
      },
    };

    (getApiPromise as jest.Mock).mockResolvedValue(api);
  });

  it("should return empty targets if nominationsOpt is None", async () => {
    api.rpc.chain.getFinalizedHead.mockResolvedValue("mockHash");
    api.query.staking.activeEra.at.mockResolvedValue({
      isNone: false,
      unwrap: () => ({ index: "activeEra" }),
    });
    api.query.staking.nominators.at.mockResolvedValue({ isNone: true });

    const result = await fetchNominations(mockAddress);

    expect(result).toEqual({
      submittedIn: null,
      targets: [],
    });
  });
  it("should return nominations with statuses and values", async () => {
    const mockTargets = [{ toString: () => "target1" }];
    const mockNominationsOpt = {
      isNone: false,
      unwrap: () => ({ targets: mockTargets, submittedIn: "submittedIn" }),
    };
    const mockStashes = [{ toString: () => "stash1" }, { toString: () => "stash2" }];
    const mockExposure = [{ isNone: false, toJSON: () => ({ pageCount: 1 }) }];
    const mockNominators = {
      unwrap: () => ({
        others: [{ who: { toString: () => mockAddress }, value: { toString: () => "100" } }],
      }),
    };

    api.rpc.chain.getFinalizedHead.mockResolvedValue("mockHash");
    api.query.staking.activeEra.at.mockResolvedValue({
      isNone: false,
      unwrap: () => ({ index: "activeEra" }),
    });
    api.query.staking.nominators.at.mockResolvedValue(mockNominationsOpt);
    api.derive.staking.stashes.mockResolvedValue(mockStashes);
    api.query.staking.erasStakersOverview.multi.mockResolvedValue(mockExposure);
    api.query.staking.erasStakersPaged.mockResolvedValue(mockNominators);

    const result = await fetchNominations(mockAddress);

    expect(result).toEqual({
      submittedIn: "submittedIn",
      targets: [{ address: "target1", value: "100", status: "active" }],
    });
  });

  it("should set status to waiting if exposure is None and target is in stashes", async () => {
    const mockTargets = [{ toString: () => "stash1" }];
    const mockNominationsOpt = {
      isNone: false,
      unwrap: () => ({ targets: mockTargets, submittedIn: "submittedIn" }),
    };
    const mockStashes = [{ toString: () => "stash1" }, { toString: () => "stash2" }];

    api.rpc.chain.getFinalizedHead.mockResolvedValue("mockHash");
    api.query.staking.activeEra.at.mockResolvedValue({
      isNone: false,
      unwrap: () => ({ index: "activeEra" }),
    });
    api.query.staking.nominators.at.mockResolvedValue(mockNominationsOpt);
    api.derive.staking.stashes.mockResolvedValue(mockStashes);
    api.query.staking.erasStakersOverview.multi.mockResolvedValue([{ isNone: true }]);

    const result = await fetchNominations(mockAddress);

    expect(result).toEqual({
      submittedIn: "submittedIn",
      targets: [{ address: "stash1", value: "0", status: "waiting" }],
    });
  });
});
