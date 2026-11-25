import React, { useCallback } from "react";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import { ConfirmationStatusLayout } from "LLM/features/Send/screens/Confirmation/components/ConfirmationStatusLayout";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import type { XrpAddTokenFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenConfirmation>
>;

export default function Confirmation({ navigation, route }: Props) {
  const { t } = useTranslation();

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  return (
    <>
      <TrackScreen category="XrpAddTokenFlow" name="ValidationSuccess" refreshSource={false} />
      <SyncOneAccountOnMount
        reason="transaction-flow-confirmation"
        priority={10}
        accountId={route.params.accountId}
      />
      <ConfirmationStatusLayout
        tone="success"
        title={t("xrp.addToken.success.title")}
        description={t("xrp.addToken.success.text")}
        testID="xrp-add-token-success"
        actions={
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            onPress={onClose}
            testID="xrp-add-token-success-close"
          >
            {t("xrp.addToken.success.cta")}
          </Button>
        }
      />
    </>
  );
}
