import "../../jest/fixtures";

describe("tools registry", () => {
  let tools: typeof import("./tools").tools;
  let registeredToolIds: typeof import("./tools").registeredToolIds;
  let registerTool: typeof import("./tools").registerTool;
  let registerStandaloneTool: typeof import("./tools").registerStandaloneTool;
  let Category: typeof import("../types").Category;

  beforeEach(() => {
    jest.isolateModules(() => {
      ({ tools, registeredToolIds, registerTool, registerStandaloneTool } = require("./tools"));
      ({ Category } = require("../types"));
    });
  });

  describe("registerTool", () => {
    it("adds the tool to the tools list", () => {
      registerTool({
        id: "test-tool",
        label: "Test Tool",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(tools).toHaveLength(1);
      expect(tools[0].id).toBe("test-tool");
    });

    it("marks the tool id as requiring props", () => {
      registerTool({
        id: "test-tool",
        label: "Test Tool",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(registeredToolIds.has("test-tool")).toBe(true);
    });

    it("returns the registered tool", () => {
      const tool = registerTool({
        id: "test-tool",
        label: "Test Tool",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(tool.id).toBe("test-tool");
    });
  });

  describe("registerStandaloneTool", () => {
    it("adds the tool to the tools list", () => {
      registerStandaloneTool({
        id: "standalone-tool",
        label: "Standalone Tool",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tools).toHaveLength(1);
      expect(tools[0].id).toBe("standalone-tool");
    });

    it("does not mark the tool id as requiring props", () => {
      registerStandaloneTool({
        id: "standalone-tool",
        label: "Standalone Tool",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(registeredToolIds.has("standalone-tool")).toBe(false);
    });

    it("returns the registered tool", () => {
      const tool = registerStandaloneTool({
        id: "standalone-tool",
        label: "Standalone Tool",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tool.id).toBe("standalone-tool");
    });
  });

  describe("duplicate guard", () => {
    it("ignores re-registration with the same id", () => {
      registerStandaloneTool({
        id: "dup",
        label: "First",
        category: Category.DEBUGGING,
        component: () => null,
      });
      registerStandaloneTool({
        id: "dup",
        label: "Second",
        category: Category.DEBUGGING,
        component: () => null,
      });
      expect(tools).toHaveLength(1);
      expect(tools[0].label).toBe("First");
    });

    it("does not promote a standalone tool to a registry tool on duplicate", () => {
      registerStandaloneTool({
        id: "test-tool",
        label: "Standalone First",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      registerTool({
        id: "test-tool",
        label: "Registry Second",
        category: Category.CONFIGURATION,
        component: () => null,
      });
      expect(registeredToolIds.has("test-tool")).toBe(false);
    });
  });
});
