import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Box, Text, Switch, Button, Tag, Divider } from "@ledgerhq/lumen-ui-rnative";
import { useWallet40ViewModel, WALLET_40_PARAMS } from "./useWallet40ViewModel";

export default function DebugWallet40() {
  const { isEnabled, params, allEnabled, handleToggleEnabled, handleToggleParam, handleToggleAll } =
    useWallet40ViewModel();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s16" }}>
        <Box lx={{ marginBottom: "s24" }}>
          <Text typography="body2" lx={{ color: "muted", marginBottom: "s16" }}>
            Toggle Wallet 4.0 features for development and testing
          </Text>

          <Box lx={{ flexDirection: "row" }}>
            <Button
              appearance="accent"
              size="sm"
              onPress={() => handleToggleAll(true)}
              disabled={allEnabled}
              lx={{ marginRight: "s12" }}
            >
              Enable All
            </Button>
            <Button
              appearance="accent"
              size="sm"
              onPress={() => handleToggleAll(false)}
              disabled={!isEnabled}
            >
              Disable All
            </Button>
          </Box>
        </Box>

        <Box lx={{ marginBottom: "s24" }}>
          <Box
            lx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: "s16",
              paddingHorizontal: "s16",
              backgroundColor: isEnabled ? "surfaceHover" : "surface",
              borderRadius: "md",
            }}
          >
            <Text lx={{ color: "base" }} typography="heading5SemiBold">
              Main Feature Enabled
            </Text>
            <Switch checked={isEnabled} onCheckedChange={handleToggleEnabled} />
          </Box>
        </Box>

        <Box lx={{ marginBottom: "s16" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
            FEATURE PARAMETERS
          </Text>
          <Divider />
        </Box>

        <Box
          lx={{
            backgroundColor: "surface",
            borderRadius: "md",
            padding: "s8",
          }}
        >
          {WALLET_40_PARAMS.map(({ key, label }, index) => {
            const isSelected = isEnabled && (params[key] ?? false);
            return (
              <Box key={key}>
                <Box
                  lx={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: "s16",
                    paddingHorizontal: "s12",
                    opacity: isEnabled ? 1 : 0.5,
                  }}
                >
                  <Box lx={{ flexDirection: "row", alignItems: "center", columnGap: "s12" }}>
                    <Text typography="body2" lx={{ color: "base" }}>
                      {label}
                    </Text>
                    {isSelected && <Tag appearance="success" size="sm" label="ON" />}
                  </Box>
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => handleToggleParam(key)}
                    disabled={!isEnabled}
                  />
                </Box>
                {index < WALLET_40_PARAMS.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Box>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
