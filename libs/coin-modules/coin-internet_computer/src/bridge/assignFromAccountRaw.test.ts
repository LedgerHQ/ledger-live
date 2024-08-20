import { setup, getMockedNeurons } from "../test/jest.mocks";
setup();
import { assignFromAccountRaw } from "./assignFromAccountRaw";
import { ICPAccount, ICPAccountRaw } from "../types";
import { getEmptyAccount, getEmptyAccountRaw, ICP_CURRENCY_MOCK } from "../test/__fixtures__";
import { NeuronsData } from "../common-logic";

describe("assignFromAccountRaw", () => {
  beforeEach(() => {
    getMockedNeurons().NeuronsData.deserialize.mockClear();
  });

  it("should not assign neurons if neuronsData is missing in accountRaw", () => {
    if (!assignFromAccountRaw) return;

    // GIVEN
    const account = {
      ...getEmptyAccount(ICP_CURRENCY_MOCK),
      neurons: undefined as unknown as NeuronsData,
    };
    const accountRaw = {
      ...getEmptyAccountRaw(ICP_CURRENCY_MOCK),
      neuronsData: undefined,
    };

    // WHEN
    assignFromAccountRaw(accountRaw as unknown as ICPAccountRaw, account as ICPAccount);

    // THEN
    expect((account as ICPAccount).neurons).toBeUndefined();
    expect(getMockedNeurons().NeuronsData.deserialize).not.toHaveBeenCalled();
  });

  it("should deserialize and assign neurons if neuronsData is present in accountRaw", () => {
    if (!assignFromAccountRaw) return;

    // GIVEN
    const account = getEmptyAccount(ICP_CURRENCY_MOCK);
    const accountRaw = getEmptyAccountRaw(ICP_CURRENCY_MOCK);
    accountRaw.neuronsData = {
      fullNeurons: "serialized_full_neurons",
      neuronInfos: "serialized_neuron_infos",
      lastUpdated: 123456789,
    };

    const deserializedNeurons = { some: "deserialized_data" };
    getMockedNeurons().NeuronsData.deserialize.mockReturnValue(deserializedNeurons as any);

    // WHEN
    assignFromAccountRaw(accountRaw, account as ICPAccount);

    // THEN
    expect(getMockedNeurons().NeuronsData.deserialize).toHaveBeenCalledWith(
      accountRaw.neuronsData.fullNeurons,
      accountRaw.neuronsData.neuronInfos,
      accountRaw.neuronsData.lastUpdated,
    );
    expect((account as ICPAccount).neurons).toBe(deserializedNeurons);
  });
});
