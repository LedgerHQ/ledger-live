import { StyleProvider, Flex, Text, Button } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";
import { TOOLS } from "./tools.config";
import { Category } from "./types";
import { useAccordion, useDevToolsNavigation } from "./hooks";

export const DevTools = () => {
  const { activeToolId, setActiveToolId, activeTool, categories } = useDevToolsNavigation(TOOLS);
  const { isExpanded, toggle } = useAccordion<Category>();

  return (
    <StyleProvider selectedPalette="dark">
      <Flex testID="devtools" flex={1} flexDirection="row" backgroundColor="background.main">
        <Flex
          testID="devtools-nav"
          flexDirection="column"
          width={220}
          flexShrink={0}
          backgroundColor="background.card"
          borderRightWidth={1}
          borderRightColor="neutral.c30"
        >
          <Text
            variant="small"
            fontWeight="medium"
            uppercase
            px={3}
            py={2}
            borderBottomWidth={1}
            borderBottomColor="neutral.c30"
          >
            DevTools
          </Text>
          <ScrollView>
            <Flex flexDirection="column" py={1} px={2}>
              {categories.map(({ category, tools }) => {
                const expanded = isExpanded(category);
                return (
                  <Flex key={category} flexDirection="column">
                    <Button
                      type="shade"
                      size="small"
                      accessibilityLabel={category}
                      accessibilityState={{ expanded }}
                      onPress={() => toggle(category)}
                    >
                      {(expanded ? "▾ " : "▸ ") + category}
                    </Button>
                    {expanded &&
                      (tools.length > 0 ? (
                        <Flex flexDirection="column" px={2}>
                          {tools.map(tool => (
                            <Button
                              key={tool.id}
                              type={tool.id === activeToolId ? "main" : "shade"}
                              size="small"
                              accessibilityLabel={tool.label}
                              onPress={() => setActiveToolId(tool.id)}
                            >
                              {tool.label}
                            </Button>
                          ))}
                        </Flex>
                      ) : (
                        <Text variant="tiny" color="neutral.c50" px={3} py={1}>
                          No tools available
                        </Text>
                      ))}
                  </Flex>
                );
              })}
            </Flex>
          </ScrollView>
        </Flex>
        <Flex testID="devtools-content" flexDirection="column" flex={1}>
          {activeTool !== null && (
            <Text variant="h5" px={6} py={4} borderBottomWidth={1} borderBottomColor="neutral.c30">
              {activeTool.label}
            </Text>
          )}
          <ScrollView>
            <Flex p={6}>
              {activeTool === null ? (
                <Text testID="devtools-empty" color="neutral.c50">
                  Select a tool from the sidebar.
                </Text>
              ) : (
                <Text>{activeTool.label}</Text>
              )}
            </Flex>
          </ScrollView>
        </Flex>
      </Flex>
    </StyleProvider>
  );
};
