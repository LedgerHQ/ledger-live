function namedError(name: string) {
  return class extends Error {
    override name = name;
  };
}

export const InvalidAddress = namedError("InvalidAddress");
export const InvalidAddressBecauseDestinationIsAlsoSource = namedError(
  "InvalidAddressBecauseDestinationIsAlsoSource",
);
