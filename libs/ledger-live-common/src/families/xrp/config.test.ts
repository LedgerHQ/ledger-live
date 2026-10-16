import { xrpConfig } from "./config";

describe.each(Object.entries(xrpConfig))("%s default", (_id, definition) => {
  it("ships with every token standard disabled", () => {
    expect(definition.default).toMatchObject({ enableTokenStandards: [] });
  });
});
