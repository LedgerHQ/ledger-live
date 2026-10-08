const currenciesFor = (value: string | undefined): readonly string[] => {
  const previous = process.env.LEDGER_LOCAL_NODE;
  if (value === undefined) delete process.env.LEDGER_LOCAL_NODE;
  else process.env.LEDGER_LOCAL_NODE = value;

  let currencies: readonly string[] = [];
  jest.isolateModules(() => {
    currencies =
      jest.requireActual<typeof import("./localNode")>("./localNode").LOCAL_NODE_CURRENCIES;
  });

  if (previous === undefined) delete process.env.LEDGER_LOCAL_NODE;
  else process.env.LEDGER_LOCAL_NODE = previous;
  return currencies;
};

describe("LOCAL_NODE_CURRENCIES", () => {
  it("is empty when LEDGER_LOCAL_NODE is unset or blank", () => {
    expect(currenciesFor(undefined)).toEqual([]);
    expect(currenciesFor("")).toEqual([]);
    expect(currenciesFor(" , ")).toEqual([]);
  });

  it("lists the comma-separated currencies, trimmed", () => {
    expect(currenciesFor("ethereum")).toEqual(["ethereum"]);
    expect(currenciesFor(" ethereum , polygon ")).toEqual(["ethereum", "polygon"]);
  });
});
