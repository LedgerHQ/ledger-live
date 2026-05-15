describe("tools registry", () => {
  let tools: typeof import("./tools").tools;
  let registerTool: typeof import("./tools").registerTool;
  let registerToolWithRequiredProps: typeof import("./tools").registerToolWithRequiredProps;
  let Category: typeof import("../types").Category;

  beforeEach(async () => {
    await jest.isolateModulesAsync(async () => {
      ({ tools, registerTool, registerToolWithRequiredProps } = await import("./tools"));
      ({ Category } = await import("../types"));
    });
  });

  describe("registerToolWithRequiredProps", () => {
    it("adds the tool to the tools list", () => {
      registerToolWithRequiredProps({
        id: "test-tool",
        label: "Test Tool",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(tools).toHaveLength(1);
      expect(tools[0].id).toBe("test-tool");
    });

    it("marks the tool as requiring host configuration", () => {
      registerToolWithRequiredProps({
        id: "test-tool",
        label: "Test Tool",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(tools[0].optional).toBe(false);
    });

    it("returns the registered tool", () => {
      const tool = registerToolWithRequiredProps({
        id: "test-tool",
        label: "Test Tool",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(tool.id).toBe("test-tool");
    });
  });

  describe("registerTool", () => {
    it("adds the tool to the tools list", () => {
      registerTool({
        id: "optional-tool",
        label: "Optional Tool",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tools).toHaveLength(1);
      expect(tools[0].id).toBe("optional-tool");
    });

    it("marks the tool as optional", () => {
      registerTool({
        id: "optional-tool",
        label: "Optional Tool",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tools[0].optional).toBe(true);
    });

    it("returns the registered tool", () => {
      const tool = registerTool({
        id: "optional-tool",
        label: "Optional Tool",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tool.id).toBe("optional-tool");
    });
  });

  describe("duplicate guard", () => {
    it("ignores re-registration with the same id", () => {
      registerTool({
        id: "dup",
        label: "First",
        category: Category.DEBUGGING,
        component: () => null,
      });
      registerTool({
        id: "dup",
        label: "Second",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tools).toHaveLength(1);
      expect(tools[0].label).toBe("First");
    });

    it("preserves the optional flag from the first registration", () => {
      registerTool({
        id: "test-tool",
        label: "Optional First",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      registerToolWithRequiredProps({
        id: "test-tool",
        label: "Required Second",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(tools[0].optional).toBe(true);
    });
  });
});
