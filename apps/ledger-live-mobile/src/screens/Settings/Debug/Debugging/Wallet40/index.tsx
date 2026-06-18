import React, { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Box, Text, Switch, Button, Tag, Divider } from "@ledgerhq/lumen-ui-rnative";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { useFeature } from "@features/platform-feature-flags";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigation, StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import SettingsRow from "~/components/SettingsRow";
import { useDispatch, useSelector } from "~/context/hooks";
import { setProductTourCompleted } from "~/actions/settings";
import { productTourCompletedSelector } from "~/reducers/settings";
import { useWallet40ViewModel, WALLET_40_PARAMS } from "./useWallet40ViewModel";

export default function DebugWallet40() {
  const navigation = useNavigation<StackNavigatorNavigation<SettingsNavigatorStackParamList>>();
  const rootNavigation = useNavigation<BaseNavigation>();
  const dispatch = useDispatch();
  const lwmProductTour = useFeature("lwmProductTour");
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const { isEnabled, params, allEnabled, handleToggleEnabled, handleToggleParam, handleToggleAll } =
    useWallet40ViewModel();

  const lwmProductTourSummary = useMemo(
    () =>
      JSON.stringify(
        {
          enabled: lwmProductTour?.enabled ?? false,
          params: lwmProductTour?.params ?? null,
        },
        null,
        2,
      ),
    [lwmProductTour?.enabled, lwmProductTour?.params],
  );

  const handleToggleProductTourCompleted = useCallback(
    (value: boolean) => {
      dispatch(setProductTourCompleted(value));
    },
    [dispatch],
  );

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

        <Box lx={{ marginTop: "s24", marginBottom: "s16" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
            FEATURES
          </Text>
          <Divider />
        </Box>

        <Box lx={{ marginBottom: "s24" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted", marginBottom: "s8" }}>
            PRODUCT TOUR — QA (Settings → Debug → Wallet V4 features)
          </Text>
          <Box lx={{ marginBottom: "s12" }}>
            <Divider />
          </Box>
          <Box
            lx={{
              backgroundColor: "surface",
              borderRadius: "md",
              padding: "s16",
            }}
          >
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s12" }}>
              Inspect the lwmProductTour feature flag and the persisted Redux flag
              productTourCompleted. This is not the carousel tour (hasSeenWalletV4Tour); use
              &quot;Wallet V4 Tour&quot; below for that.
            </Text>
            <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
              Feature flag: useFeature(&quot;lwmProductTour&quot;) — enabled + params
            </Text>
            <Text typography="body3" lx={{ color: "base", marginBottom: "s16" }}>
              {lwmProductTourSummary}
            </Text>
            <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
              Product Tour — completed (persisted)
            </Text>
            <Text typography="body3" lx={{ color: "muted", marginBottom: "s12" }}>
              Current productTourCompleted (Redux): {productTourCompleted ? "Yes" : "No"}
            </Text>
            <Box
              lx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: "s8",
              }}
            >
              <Text typography="body2" lx={{ color: "base", flexShrink: 1, paddingRight: "s12" }}>
                QA: Toggle dispatches setProductTourCompleted (persisted in mobile settings)
              </Text>
              <Switch
                testID="debug-product-tour-completed-switch"
                checked={productTourCompleted}
                onCheckedChange={handleToggleProductTourCompleted}
              />
            </Box>
          </Box>
        </Box>

        <SettingsRow
          title="Asset Detail"
          desc="Open asset detail screen with Bitcoin"
          iconLeft={<IconsLegacy.CoinsMedium size={24} color="black" />}
          arrowRight
          onPress={() =>
            rootNavigation.navigate(NavigatorName.AssetDetail, {
              screen: ScreenName.AssetDetail,
              params: { currencyId: "bitcoin" },
            })
          }
        />

        <SettingsRow
          title="Wallet V4 Tour"
          desc="Test tour drawer"
          iconLeft={<IconsLegacy.NewsMedium size={24} color="black" />}
          arrowRight
          onPress={() => navigation.navigate(ScreenName.DebugWalletV4Tour)}
        />
        <SettingsRow
          title="Product Tour"
          desc="Test product tour drawer"
          iconLeft={<IconsLegacy.NewsMedium size={24} color="black" />}
          arrowRight
          onPress={() => navigation.navigate(ScreenName.DebugProductTour)}
        />
        <SettingsRow
          title="Q2 Wallet V4 Tour (Images)"
          desc="Test image-based Q2 Wallet V4 tour drawer"
          iconLeft={<IconsLegacy.NewsMedium size={24} color="black" />}
          arrowRight
          onPress={() => navigation.navigate(ScreenName.DebugQ2WalletV4Tour)}
        />
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
