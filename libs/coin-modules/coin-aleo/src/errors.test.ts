import * as errors from "./errors";
import {
  AleoAlreadyBondedElsewhere,
  AleoBondAmountTooLow,
  AleoClosedValidator,
  AleoStakeAmountTooLow,
  AleoUnbondingValidator,
} from "./errors";

describe("error names", () => {
  // `name` is the cross-boundary contract: it is what the clients key their translations
  // off, so renaming one silently drops a user-facing message.
  it.each(Object.entries({ ...errors }))("%s carries its own class name", (exported, Klass) => {
    expect(new Klass().name).toBe(exported);
  });

  it("defaults the message to the class name when none is given", () => {
    expect(new AleoClosedValidator().message).toBe("AleoClosedValidator");
  });

  it("keeps an explicit message", () => {
    expect(new AleoClosedValidator("validator 7 is closed").message).toBe("validator 7 is closed");
  });

  it("survives the serialization that strips prototypes", () => {
    const revived = JSON.parse(JSON.stringify(new AleoUnbondingValidator()));

    expect(revived).not.toBeInstanceOf(AleoUnbondingValidator);
    expect(revived.name).toBe("AleoUnbondingValidator");
  });
});

describe("interpolation fields", () => {
  // TranslatedError builds its i18n values by spreading the error, which only picks up
  // enumerable own properties — a field assigned any other way never reaches the string.
  it("exposes minAmount to a spread", () => {
    const error = new AleoBondAmountTooLow(undefined, { minAmount: "1 ALEO" });

    expect({ ...error }).toMatchObject({ minAmount: "1 ALEO" });
  });

  it("exposes bondedValidator to a spread", () => {
    const error = new AleoAlreadyBondedElsewhere(undefined, { bondedValidator: "aleo1other" });

    expect({ ...error }).toMatchObject({ bondedValidator: "aleo1other" });
  });

  it("assigns no extra field when none is passed", () => {
    expect(Object.keys({ ...new AleoStakeAmountTooLow() })).toEqual(["name"]);
  });
});
