import {
  BottomSheetHeader,
  BottomSheetView,
  type IconProps,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemSpot,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import * as LumenSymbols from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigationProp, ParamListBase, useRoute } from "@react-navigation/native";
import React from "react";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { makeSetEarnMenuBottomSheetAction } from "~/actions/earn";
import { track } from "~/analytics";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { AnalyticEvents } from "LLM/hooks/useAnalytics/enums";
import { NavigatorName, ScreenName } from "~/const";
import { earnMenuBottomSheetSelector } from "~/reducers/earn";

function isValidIntent(intent?: string): intent is "deposit" | "withdraw" {
  return ["deposit", "withdraw"].includes(intent ?? "");
}

function isValidEarnManifestId(
  manifestId?: string,
): manifestId is "earn" | "earn-stg" | "earn-prd-eks" {
  return ["earn", "earn-stg", "earn-prd-eks"].includes(manifestId ?? "");
}

function isLumenSymbolName(name: string): name is keyof typeof LumenSymbols {
  return name in LumenSymbols;
}

function resolveMenuItemIcon(iconName: string): React.ComponentType<IconProps> | null {
  if (isLumenSymbolName(iconName)) {
    return LumenSymbols[iconName];
  }
  return null;
}

type EarnMenuBottomSheetProps = Readonly<{
  navigation: NavigationProp<ParamListBase>;
}>;

export function EarnMenuBottomSheet({ navigation }: EarnMenuBottomSheetProps) {
  const dispatch = useDispatch();
  const route = useRoute();
  const menuBottomSheet = useSelector(earnMenuBottomSheetSelector);

  const closeBottomSheet = () => {
    dispatch(makeSetEarnMenuBottomSheetAction(undefined));
  };

  const handleMenuItemPress = async (
    link: string,
    live_app: string | undefined,
    tracked: Record<string, unknown>,
  ) => {
    await track(AnalyticEvents.ButtonClicked, { live_app, ...tracked });
    closeBottomSheet();
    if (isValidEarnManifestId(live_app)) {
      const pathSegments = link.split("?");
      const earnSearchParams = new URLSearchParams(pathSegments.pop());
      const intent = earnSearchParams.get("intent") ?? undefined;
      const accountId = earnSearchParams.get("accountId");
      const earnParams = Object.fromEntries(earnSearchParams.entries());

      if (!isValidIntent(intent)) {
        console.warn(`Invalid earn flow intent: ${intent}. Expected "deposit" or "withdraw".`);
      }
      navigation.navigate(NavigatorName.Base, {
        screen: NavigatorName.Earn,
        params: {
          screen: ScreenName.Earn,
          ...route.params,
          platform: "earn",
          params: {
            ...earnParams,
            intent: isValidIntent(intent) ? intent : undefined,
            accountId: accountId,
          },
        },
      });
    } else {
      await Linking.openURL(link);
    }
  };

  const options = menuBottomSheet ?? [];

  const isRequestingToBeOpened = options.length > 0;

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={closeBottomSheet}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: 24 }}>
        <BottomSheetHeader />
        {options.map(({ icon, label, metadata }) => {
          const { link, live_app, ...tracked } = metadata;
          const IconComponent = resolveMenuItemIcon(icon);
          return link ? (
            <ListItem
              key={label}
              onPress={() => handleMenuItemPress(link, live_app, tracked)}
              style={{ marginHorizontal: -8 }}
            >
              <ListItemLeading>
                {IconComponent && <ListItemSpot appearance="icon" icon={IconComponent} />}
                <ListItemContent>
                  <ListItemTitle>{label}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
            </ListItem>
          ) : null;
        })}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
