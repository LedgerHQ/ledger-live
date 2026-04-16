import React, { memo, useCallback, useMemo, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton, NavBar, NavBarContent, NavBarTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import AgentHeaderSection from "./components/AgentHeaderSection";
import AgentBalanceSection from "./components/AgentBalanceSection";
import AgentPnlSection from "./components/AgentPnlSection";
import AgentRoleSection from "./components/AgentRoleSection";
import AgentActivitySection from "./components/AgentActivitySection";
import type { AgentDetailViewModel } from "./useAgentDetailViewModel";

function NavBarBackButton({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
NavBarBackButton.displayName = "NavBarBackButton";

const AgentDetailScreenView = ({
  name,
  status,
  iconComponent,
  balanceInteger,
  balanceDecimal,
  pnlPercent,
  pnlAbsolute,
  pnlPeriod,
  pnlIsPositive,
  pnlChartData,
  role,
  activity,
  onFundAgent,
  onWithdraw,
}: Readonly<AgentDetailViewModel>) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const scrollContentStyle = useMemo(
    () => [styles.container, { paddingBottom: insets.bottom + 32 }],
    [insets.bottom],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.base, paddingTop: insets.top }]}>
      <NavBar appearance="compact">
        <NavBarBackButton>
          <IconButton
            appearance="no-background"
            size="md"
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={handleGoBack}
          />
        </NavBarBackButton>
        <NavBarContent>
          <NavBarTitle>{name}</NavBarTitle>
        </NavBarContent>
      </NavBar>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        <AgentHeaderSection
          name={name}
          status={status}
          iconComponent={iconComponent}
          onFundAgent={onFundAgent}
          onWithdraw={onWithdraw}
        />

        <AgentBalanceSection
          balanceInteger={balanceInteger}
          balanceDecimal={balanceDecimal}
          pnlPercent={pnlPercent}
          pnlPeriod={pnlPeriod}
          pnlIsPositive={pnlIsPositive}
        />

        <AgentPnlSection
          pnlPercent={pnlPercent}
          pnlAbsolute={pnlAbsolute}
          pnlPeriod={pnlPeriod}
          pnlIsPositive={pnlIsPositive}
          chartData={pnlChartData}
        />

        <AgentRoleSection role={role} />

        <AgentActivitySection activity={activity} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
});

export default memo(AgentDetailScreenView);
