import React from "react";
import { Alert, Box, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  CONCORDIUM_TOKEN_NOTICE_ERROR,
  tokenNoticeFor,
} from "@ledgerhq/live-common/families/concordium/types";

/**
 * Warns about token state the generic token screen does not model.
 *
 * `AccountSubHeader`, not `AccountBodyHeader`: the latter is skipped when
 * `isAccountEmpty` is true, which a PLT sub-account with no balance and no
 * operations is. It is also the family's only sub-header slot, so it renders for
 * the parent account too — `tokenNoticeFor` reports nothing for one.
 *
 * The title goes in the children, not `Alert`'s `title` prop: that prop is a row
 * sibling of the children, so passing both would set the two lines side by side.
 * The stacked `Flex` takes the width left beside the icon, which is what lets a
 * long message wrap.
 *
 * `accessibilityLiveRegion="polite"`: sync can populate the token state while
 * the screen is open, so the message is worth announcing without interrupting.
 */
export default function ConcordiumAccountSubHeader({
  account,
  parentAccount,
}: {
  readonly account: AccountLike;
  readonly parentAccount: Account | null | undefined;
}) {
  const { t } = useTranslation();
  const notice = tokenNoticeFor(account, parentAccount);

  if (!notice) return null;

  const error = CONCORDIUM_TOKEN_NOTICE_ERROR[notice];

  return (
    <Box mx={6} mb={6} accessibilityLiveRegion="polite">
      <Alert type="warning">
        <Flex flexDirection="column" rowGap={4} flex={1}>
          <Text variant="bodyLineHeight" fontWeight="semiBold" color="neutral.c100">
            {t(`errors.${error}.title`)}
          </Text>
          <Text variant="body" color="neutral.c100">
            {t(`errors.${error}.description`)}
          </Text>
        </Flex>
      </Alert>
    </Box>
  );
}
