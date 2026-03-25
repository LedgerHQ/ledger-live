import { setup } from "../test/jest.mocks";
setup();
import { assignToAccountRaw } from "./assignToAccountRaw";
import { ICPAccount, ICPAccountRaw } from "../types";
import { getEmptyAccount, getEmptyAccountRaw, ICP_CURRENCY_MOCK } from "../test/__fixtures__";

describe("assignToAccountRaw", () => {
  it("should serialize and assign neurons to accountRaw", () => {
    if (!assignToAccountRaw) return;

    // GIVEN
    const account = getEmptyAccount(ICP_CURRENCY_MOCK) as ICPAccount;
    const accountRaw = getEmptyAccountRaw(ICP_CURRENCY_MOCK) as ICPAccountRaw;

    const mockNeurons = {
      serialize: jest.fn().mockReturnValue({
        fullNeurons: "serialized_full_neurons",
        neuronInfos: "serialized_neuron_infos",
      }),
      lastUpdatedMSecs: 123456789,
    };
    account.neurons = mockNeurons as any;

    // WHEN
    assignToAccountRaw(account, accountRaw);

    // THEN
    expect(mockNeurons.serialize).toHaveBeenCalled();
    expect(accountRaw.neuronsData).toEqual({
      fullNeurons: "serialized_full_neurons",
      neuronInfos: "serialized_neuron_infos",
      lastUpdated: 123456789,
    });
  });
});
