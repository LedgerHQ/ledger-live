import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { Theme } from "@ledgerhq/native-ui/lib/styles/theme";
import React, { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components/native";
import { makeSetEarnMenuModalAction } from "~/actions/earn";
import { track } from "~/analytics";
import QueuedDrawer from "~/components/QueuedDrawer";
import { earnMenuModalSelector } from "~/reducers/earn";

export function EarnMenuDrawer() {
  const dispatch = useDispatch();
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
          {modal?.options.map(({ label, metadata: { link, button, ...tracked } }) =>
            link ? (
              <OptionButton
                key={label}
                onPress={() => {
                  Linking.openURL(link);
                  track(button, tracked);
                  closeDrawer();
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
  padding: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:focus,
  &:hover {
    background-color: ${p => p.theme.colors.neutral.c50};
  }
`;
