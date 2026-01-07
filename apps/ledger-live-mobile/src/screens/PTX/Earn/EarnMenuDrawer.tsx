import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Theme } from "@ledgerhq/native-ui/lib/styles/theme";
import { useRoute, NavigationProp, ParamListBase } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import styled from "styled-components/native";
import { makeSetEarnMenuModalAction } from "~/actions/earn";
import { track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { NavigatorName, ScreenName } from "~/const";
import { earnMenuModalSelector } from "~/reducers/earn";

function isValidIntent(intent?: string): intent is "deposit" | "withdraw" {
  return ["deposit", "withdraw"].includes(intent ?? "");
}

export function isValidEarnManifestId(
  manifestId?: string,
): manifestId is "earn" | "earn-stg" | "earn-prd-eks" {
  return ["earn", "earn-stg", "earn-prd-eks"].includes(manifestId ?? "");
}

/** TODO Should be a shared constant throughout the app for all events */
const BUTTON_CLICKED_TRACK_EVENT = "button_clicked";

export function EarnMenuDrawer({ navigation }: { navigation: NavigationProp<ParamListBase> }) {
  const dispatch = useDispatch();
  const route = useRoute();
  const [modalOpened, setModalOpened] = useState(false);

  const openModal = useCallback(() => setModalOpened(true), []);
  const modal = useSelector(earnMenuModalSelector);

  const closeDrawer = useCallback(() => {
    setModalOpened(false);
    dispatch(makeSetEarnMenuModalAction(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (!modalOpened) {
      openModal();
    }
  }, [openModal, modalOpened]);

  return (
    <QueuedDrawer isRequestingToBeOpened={Boolean(modal)} onClose={closeDrawer}>
      <Flex rowGap={48}>
        {modal?.title ? (
          <Text variant="h4" fontFamily="Inter" textAlign="center" fontWeight="bold">
            {modal?.title}
          </Text>
        ) : null}
        <Flex rowGap={16}>
          {modal?.options.map(({ label, metadata: { link, live_app, ...tracked } }) =>
            link ? (
              <OptionButton
                key={label}
                onPress={async () => {
                  await track(BUTTON_CLICKED_TRACK_EVENT, { live_app, ...tracked });
                  closeDrawer();
                  if (isValidEarnManifestId(live_app)) {
                    const pathSegments = link.split("?");
                    const earnSearchParams = new URLSearchParams(pathSegments.pop());
                    const intent = earnSearchParams.get("intent") ?? undefined;
                    const accountId = earnSearchParams.get("accountId");
                    const earnParams = Object.fromEntries(earnSearchParams.entries());

                    if (!isValidIntent(intent)) {
                      console.warn(
                        `Invalid earn flow intent: ${intent}. Expected "deposit" or "withdraw".`,
                      );
                    }
                    // Use the base navigator to allow back navigation and hide the main navigation bar from the bottom
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
                }}
              >
                {label}
              </OptionButton>
            ) : null,
          )}
        </Flex>
      </Flex>
    </QueuedDrawer>
  );
}

const OptionButton = styled(Button)<{
  theme: Theme;
}>`
  color: ${p => p.theme.colors.neutral.c100};
  background-color: ${p => p.theme.colors.neutral.c40};
  border-color: transparent;
  border-radius: 16px;
  display: inline-flex;
  font-weight: 600;
  justify-content: left;
  max-width: 100%;
  overflow: hidden;
  height: auto;
  padding: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:focus,
  &:hover {
    background-color: ${p => p.theme.colors.neutral.c50};
  }
`;
