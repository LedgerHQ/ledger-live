import { ThemeProvider, Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { ScrollView } from "react-native";
import { TOOLS } from "./tools.config";
import { Category } from "./types";
import { useAccordion, useDevToolsNavigation } from "./hooks";

export const DevTools = () => {
  const { activeTool, setActiveToolId, categories } = useDevToolsNavigation(TOOLS);
  const { isExpanded, toggle } = useAccordion<Category>();

  return (
    <ThemeProvider themes={ledgerLiveThemes} colorScheme="dark">
      <Box testID="devtools" lx={{ flex: 1, flexDirection: "row", backgroundColor: "canvas" }}>
        <Box
          testID="devtools-nav"
          lx={{
            flexDirection: "column",
            flexShrink: 0,
            backgroundColor: "surface",
            borderRightWidth: "s1",
            borderRightColor: "muted",
          }}
          style={{ width: 220 }}
        >
          <Text
            typography="body2SemiBold"
            lx={{
              paddingHorizontal: "s12",
              paddingVertical: "s8",
              borderBottomWidth: "s1",
              borderBottomColor: "muted",
            }}
            style={{ textTransform: "uppercase" }}
          >
            DevTools
          </Text>
          <ScrollView>
            <Box lx={{ flexDirection: "column", paddingVertical: "s4", paddingHorizontal: "s8" }}>
              {categories.map(({ category, tools }) => (
                <Box key={category} lx={{ flexDirection: "column" }}>
                  <Button
                    appearance="gray"
                    size="sm"
                    isFull
                    accessibilityLabel={category}
                    onPress={() => toggle(category)}
                  >
                    {(isExpanded(category) ? "▾ " : "▸ ") + category}
                  </Button>
                  {isExpanded(category) && tools.length > 0 && (
                    <Box lx={{ flexDirection: "column", paddingHorizontal: "s8" }}>
                      {tools.map(tool => (
                        <Button
                          key={tool.id}
                          appearance={activeTool?.id === tool.id ? "accent" : "gray"}
                          size="sm"
                          isFull
                          accessibilityLabel={tool.label}
                          onPress={() => setActiveToolId(tool.id)}
                        >
                          {tool.label}
                        </Button>
                      ))}
                    </Box>
                  )}
                  {isExpanded(category) && tools.length === 0 && (
                    <Text
                      typography="body3"
                      lx={{ color: "muted", paddingHorizontal: "s12", paddingVertical: "s4" }}
                    >
                      No tools available
                    </Text>
                  )}
                </Box>
              ))}
            </Box>
          </ScrollView>
        </Box>
        <Box testID="devtools-content" lx={{ flexDirection: "column", flex: 1 }}>
          {activeTool !== null && (
            <Text
              typography="heading3SemiBold"
              lx={{
                paddingHorizontal: "s24",
                paddingVertical: "s16",
                borderBottomWidth: "s1",
                borderBottomColor: "muted",
              }}
            >
              {activeTool.label}
            </Text>
          )}
          <ScrollView>
            <Box lx={{ padding: "s24" }}>
              {activeTool === null ? (
                <Text testID="devtools-empty" typography="body2" lx={{ color: "muted" }}>
                  Select a tool from the sidebar.
                </Text>
              ) : (
                <Text typography="body2">{activeTool.label}</Text>
              )}
            </Box>
          </ScrollView>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
