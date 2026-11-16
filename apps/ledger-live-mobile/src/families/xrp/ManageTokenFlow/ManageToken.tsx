import React, { useCallback } from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Delete, Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import type { XrpManageTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpManageTokenFlowParamList, ScreenName.XrpManageTokenManage>
>;

export default function ManageToken({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { accountId, parentId } = route.params;

  const onTokenSettings = useCallback(() => {
    navigation.navigate(ScreenName.XrpManageTokenSettings, { accountId, parentId });
  }, [accountId, navigation, parentId]);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="ManageToken" />
      <Box lx={{ padding: "s16", gap: "s8" }}>
        <ListItem onPress={onTokenSettings} testID="xrp-manage-token-settings">
          <ListItemLeading>
            <Spot icon={Settings} />
            <ListItemContent>
              <ListItemTitle>{t("xrp.manageToken.tokenSettings")}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
        <ListItem disabled testID="xrp-manage-token-remove">
          <ListItemLeading>
            <Spot icon={Delete} />
            <ListItemContent>
              <ListItemTitle>{t("xrp.manageToken.removeToken")}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      </Box>
    </SafeAreaView>
  );
}
