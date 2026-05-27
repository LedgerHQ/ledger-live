import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ScrollView, TextInput, Pressable } from "react-native";
import { Suspense, lazy, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Category, tools as registry } from "@devtools/registry";
import type { DevToolsConfig, Tool, ValueOf } from "@devtools/registry";
import { DevToolsProvider } from "../context";
import { filterToolsByPlatform } from "../utils/toolsUtils";
import { Loading } from "../components/Loading/Loading.native";

export interface DevToolsProps {
  config?: DevToolsConfig;
  fallback?: ReactNode;
}

type Screen = "home" | "category" | "tool";

const CATEGORIES = Object.values(Category);

const DevToolsShell = ({ config }: { config: DevToolsConfig }) => {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeCategory, setActiveCategory] = useState<ValueOf<typeof Category> | null>(null);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [query, setQuery] = useState("");

  const tools = useMemo<Tool[]>(
    () =>
      config.map(item => {
        const tool = registry[item.id];
        return { id: item.id, ...tool, component: lazy(tool.loader) };
      }),
    [config],
  );
  const q = query.trim().toLowerCase();
  const nativeTools = useMemo(() => filterToolsByPlatform(tools, "native"), [tools]);

  const toolsByCategory = CATEGORIES.map(cat => ({
    category: cat,
    tools: nativeTools.filter(t => t.category === cat),
  })).filter(({ tools }) => tools.length > 0);

  const navigateToCategory = (cat: ValueOf<typeof Category>) => {
    setActiveCategory(cat);
    setScreen("category");
    setQuery("");
  };

  const navigateToTool = (tool: Tool) => {
    setActiveTool(tool);
    setScreen("tool");
  };

  const goBack = () => {
    if (screen === "tool") {
      setScreen("category");
    } else {
      setScreen("home");
      setActiveCategory(null);
    }
    setQuery("");
  };

  const filteredHome = toolsByCategory.filter(
    ({ category, tools }) =>
      !q ||
      category.toLowerCase().includes(q) ||
      tools.some(t => t.label.toLowerCase().includes(q)),
  );

  return (
    <Box testID="devtools" lx={{ flex: 1, flexDirection: "column", backgroundColor: "canvas" }}>
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s6", backgroundColor: "warning" }}>
        <Text typography="body3SemiBold" lx={{ color: "warning" }}>
          Internal tools
        </Text>
      </Box>

      {screen === "home" && (
        <Box testID="devtools-home" lx={{ flex: 1, flexDirection: "column" }}>
          <Box lx={{ padding: "s12" }}>
            <TextInput
              testID="devtools-search"
              value={query}
              onChangeText={setQuery}
              placeholder="Search tools"
              accessibilityLabel="Search tools"
            />
          </Box>
          <ScrollView>
            {filteredHome.map(({ category, tools }, i) => (
              <Pressable
                key={category}
                testID={`devtools-category-${category}`}
                accessibilityLabel={category}
                accessibilityRole="button"
                onPress={() => navigateToCategory(category)}
              >
                <Box
                  lx={{
                    paddingHorizontal: "s16",
                    paddingVertical: "s14",
                    borderBottomWidth: i === filteredHome.length - 1 ? undefined : "s1",
                    borderBottomColor: "muted",
                  }}
                >
                  <Text typography="body1SemiBold">{category}</Text>
                  <Text typography="body3" lx={{ color: "muted", marginTop: "s2" }}>
                    {tools.length} tool{tools.length === 1 ? "" : "s"}
                  </Text>
                </Box>
              </Pressable>
            ))}
            {filteredHome.length === 0 && (
              <Box lx={{ padding: "s16" }}>
                <Text typography="body2" lx={{ color: "muted" }}>
                  No tools match &ldquo;{q}&rdquo;.
                </Text>
              </Box>
            )}
          </ScrollView>
        </Box>
      )}

      {screen === "category" && activeCategory && (
        <Box testID="devtools-category-screen" lx={{ flex: 1, flexDirection: "column" }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={goBack}>
            <Box
              lx={{
                paddingHorizontal: "s16",
                paddingVertical: "s14",
                borderBottomWidth: "s1",
                borderBottomColor: "muted",
              }}
            >
              <Text typography="body1SemiBold">{activeCategory}</Text>
            </Box>
          </Pressable>
          <ScrollView>
            {nativeTools
              .filter(t => t.category === activeCategory)
              .map(tool => (
                <Pressable
                  key={tool.id}
                  testID={`devtools-tool-${tool.id}`}
                  accessibilityLabel={tool.label}
                  accessibilityRole="button"
                  onPress={() => navigateToTool(tool)}
                >
                  <Box
                    lx={{
                      paddingHorizontal: "s16",
                      paddingVertical: "s14",
                      borderBottomWidth: "s1",
                      borderBottomColor: "muted",
                    }}
                  >
                    <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
                      <Text typography="body1SemiBold">{tool.label}</Text>
                      {tool.owner && (
                        <Text typography="body3" lx={{ color: "muted" }}>
                          {tool.owner}
                        </Text>
                      )}
                    </Box>
                    {tool.desc && (
                      <Text typography="body3" lx={{ color: "muted", marginTop: "s2" }}>
                        {tool.desc}
                      </Text>
                    )}
                  </Box>
                </Pressable>
              ))}
          </ScrollView>
        </Box>
      )}

      {screen === "tool" && activeTool && (
        <Box testID="devtools-content" lx={{ flex: 1, flexDirection: "column" }}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={goBack}>
            <Box
              lx={{
                paddingHorizontal: "s16",
                paddingVertical: "s14",
                borderBottomWidth: "s1",
                borderBottomColor: "muted",
              }}
            >
              <Text typography="body3" lx={{ color: "muted" }}>
                ← {activeTool.category}
              </Text>
            </Box>
          </Pressable>
          <Box
            lx={{
              paddingHorizontal: "s24",
              paddingVertical: "s16",
              borderBottomWidth: "s1",
              borderBottomColor: "muted",
            }}
          >
            <Text typography="heading3SemiBold">{activeTool.label}</Text>
            {activeTool.desc && (
              <Text typography="body3" lx={{ color: "muted", marginTop: "s4" }}>
                {activeTool.desc}
              </Text>
            )}
          </Box>
          <ScrollView>
            <Box lx={{ padding: "s24" }}>
              <Text typography="body2">{activeTool.label}</Text>
            </Box>
          </ScrollView>
        </Box>
      )}
    </Box>
  );
};

export const DevTools = ({ config = [], fallback }: DevToolsProps) => (
  <DevToolsProvider value={config}>
    <Suspense fallback={fallback ?? <Loading />}>
      <DevToolsShell config={config} />
    </Suspense>
  </DevToolsProvider>
);
