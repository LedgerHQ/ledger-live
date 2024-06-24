import { ContextModuleBuilder } from "./ContextModuleBuilder";
import { DefaultContextModule } from "./DefaultContextModule";

describe("ContextModuleBuilder", () => {
  it("should return a default context module", () => {
    const contextModuleBuilder = new ContextModuleBuilder();

    const res = contextModuleBuilder.build();

    expect(res).toBeInstanceOf(DefaultContextModule);
  });

  it("should return a custom context module", () => {
    const contextModuleBuilder = new ContextModuleBuilder();
    const customLoader = { load: jest.fn() };

    const res = contextModuleBuilder.withoutDefaultLoaders().addLoader(customLoader).build();

    expect(res).toBeInstanceOf(DefaultContextModule);
  });
});
