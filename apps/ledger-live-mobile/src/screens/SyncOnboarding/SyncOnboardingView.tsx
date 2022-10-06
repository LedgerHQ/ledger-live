import { Flex, ScrollListContainer } from "@ledgerhq/native-ui";
import React, { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";

import Header, { Props as HeaderProps } from "./Header";

export type Props = HeaderProps & {
  noScroll?: boolean;
  noPadding?: boolean;
  children?: ReactNode;
};

const SyncOnboardingView = ({
  noScroll,
  noPadding,
  children,
  ...props
}: Props) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[{ flex: 1 }, { backgroundColor: colors.background.main }]}
    >
      <Header {...props} />
      {(noScroll && (
        <Flex flex={1} px={noPadding ? 0 : 6}>
          {children}
        </Flex>
      )) || (
        <ScrollListContainer display="flex" flex={1} px={noPadding ? 0 : 6}>
          {children}
        </ScrollListContainer>
      )}
    </SafeAreaView>
  );
};

export default SyncOnboardingView;
