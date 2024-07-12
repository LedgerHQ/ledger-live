export const emptyState = new Map<string, string>();

// index 0 => gen 1 account names, index 1 => gen 2 accounts names, etc.
export const genState = (index: number) => {
  const tuples: [string, string][] = Array(index + 1)
    .fill(null)
    .map((_, i) => [`fakeaccountid-${i}`, `name-${i}`]);

  // we shift some of the items so that we do have some cases of rename from the previous state
  let skipEach = 2;
  for (let i = skipEach; i < tuples.length; i += skipEach) {
    tuples[i - 1][0] = tuples[i][0];
    skipEach++;
  }

  return new Map(tuples);
};

export const convertLocalToDistantState = (localState: Map<string, string>) =>
  Object.fromEntries(localState);

export const convertDistantToLocalState = (distantState: Record<string, string>) =>
  new Map(Object.entries(distantState));

export const similarLocalState = (a: Map<string, string>, b: Map<string, string>) => {
  if ([...a.keys()].join(" ") !== [...b.keys()].join(" ")) return false;
  for (const [key, value] of b.entries()) {
    if (a.get(key) !== value) {
      return false;
    }
  }
  return true;
};
