import React, { memo, useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IconButton,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  NavBar,
  NavBarContent,
  NavBarTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ArrowLeft, ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import TransactionDetailBottomSheet from "../BaanxDashboardScreen/components/TransactionDetailBottomSheet";
import type { TransactionItem } from "../BaanxDashboardScreen/mapCardTransaction";
import type {
  BaanxTransactionHistoryViewModel,
  FilterType,
  FilterAsset,
  TransactionSection,
} from "./useBaanxTransactionHistoryViewModel";

function NavBarBackButton({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
NavBarBackButton.displayName = "NavBarBackButton";

const TYPE_OPTIONS: readonly FilterType[] = ["all", "sent", "received", "pending"];

function FilterChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: theme.colors.bg.muted }]}
    >
      <Text typography="body3SemiBold" style={{ color: theme.colors.text.base }}>
        {label}
      </Text>
      <ChevronDown size={12} color="base" />
    </Pressable>
  );
}

function DropdownMenu({
  visible,
  options,
  selectedValue,
  onSelect,
}: {
  visible: boolean;
  options: readonly { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <View
      style={[
        styles.dropdownMenu,
        {
          backgroundColor: theme.colors.bg.muted,
          borderColor: theme.colors.border.base,
        },
      ]}
    >
      {options.map(option => (
        <Pressable
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={[
            styles.dropdownItem,
            selectedValue === option.value && {
              backgroundColor: theme.colors.bg.base,
            },
          ]}
        >
          <Text
            typography="body3"
            style={{
              color:
                selectedValue === option.value
                  ? theme.colors.text.base
                  : theme.colors.text.muted,
            }}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function MerchantLogo({ tx }: { tx: TransactionItem }) {
  const { theme } = useTheme();
  if (tx.logoUri) {
    return <Image source={{ uri: tx.logoUri }} style={styles.merchantLogo} resizeMode="cover" />;
  }
  return (
    <View style={[styles.merchantLogo, { backgroundColor: tx.logoColor ?? theme.colors.bg.muted }]}>
      <Text typography="body3SemiBold" style={{ color: theme.colors.text.white }}>
        {tx.merchant.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

function TransactionSectionBlock({
  section,
  onSelectTransaction,
}: {
  section: TransactionSection;
  onSelectTransaction: (tx: TransactionItem) => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <Text typography="body2SemiBold" lx={{ color: "muted" }} style={styles.sectionTitle}>
        {section.title}
      </Text>
      <View style={styles.sectionList}>
        {section.data.map(tx => (
          <ListItem key={tx.id} lx={listItemLx} onPress={() => onSelectTransaction(tx)}>
            <ListItemLeading>
              <MerchantLogo tx={tx} />
              <ListItemContent style={listItemContentStyle}>
                <ListItemTitle typography="body2SemiBold" numberOfLines={1}>
                  {tx.merchant}
                </ListItemTitle>
                <ListItemDescription typography="body3" numberOfLines={1}>
                  {tx.date}
                </ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {tx.amount}
              </Text>
            </ListItemTrailing>
          </ListItem>
        ))}
      </View>
    </View>
  );
}

const BaanxTransactionHistoryView = memo(function BaanxTransactionHistoryView(
  vm: Readonly<BaanxTransactionHistoryViewModel>,
) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const bgColor = theme.colors.bg.base;

  const [openDropdown, setOpenDropdown] = useState<"type" | "asset" | "address" | null>(null);

  const toggleDropdown = useCallback(
    (key: "type" | "asset" | "address") => {
      setOpenDropdown(prev => (prev === key ? null : key));
    },
    [],
  );

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  const typeLabel =
    vm.selectedType === "all"
      ? t("baanxCard.transactions.filters.type")
      : t(`baanxCard.transactions.filters.${vm.selectedType}`);

  const assetLabel =
    vm.selectedAsset === "all" ? t("baanxCard.transactions.filters.asset") : vm.selectedAsset;

  const typeOptions = TYPE_OPTIONS.map(v => ({
    value: v,
    label:
      v === "all"
        ? t("baanxCard.transactions.filters.all")
        : t(`baanxCard.transactions.filters.${v}`),
  }));

  const assetOptions = [
    { value: "all", label: t("baanxCard.transactions.filters.all") },
    ...vm.availableAssets.map(a => ({ value: a, label: a })),
  ];

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.root, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      <NavBar appearance="compact">
        <NavBarBackButton>
          <IconButton
            appearance="no-background"
            size="md"
            icon={ArrowLeft}
            accessibilityLabel={t("common.back")}
            onPress={handleGoBack}
          />
        </NavBarBackButton>
        <NavBarContent style={styles.navBarContent}>
          <NavBarTitle>{t("baanxCard.transactions.historyTitle")}</NavBarTitle>
        </NavBarContent>
      </NavBar>

      <View style={styles.filtersRow}>
        <View style={styles.filterWrapper}>
          <FilterChip
            label={typeLabel}
            onPress={() => toggleDropdown("type")}
          />
          <DropdownMenu
            visible={openDropdown === "type"}
            options={typeOptions}
            selectedValue={vm.selectedType}
            onSelect={v => {
              vm.onSelectType(v as FilterType);
              closeDropdown();
            }}
          />
        </View>

        <View style={styles.filterWrapper}>
          <FilterChip
            label={assetLabel}
            onPress={() => toggleDropdown("asset")}
          />
          <DropdownMenu
            visible={openDropdown === "asset"}
            options={assetOptions}
            selectedValue={vm.selectedAsset}
            onSelect={v => {
              vm.onSelectAsset(v as FilterAsset);
              closeDropdown();
            }}
          />
        </View>

        <View style={styles.filterWrapper}>
          <FilterChip
            label={t("baanxCard.transactions.filters.address")}
            onPress={() => toggleDropdown("address")}
          />
        </View>
      </View>

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.colors.text.muted} />
        </View>
      ) : vm.sections.length === 0 ? (
        <View style={styles.centered}>
          <Text typography="body3" lx={{ color: "muted" }}>
            {t("baanxCard.transactions.empty")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {vm.sections.map(section => (
            <TransactionSectionBlock
              key={section.title}
              section={section}
              onSelectTransaction={vm.onSelectTransaction}
            />
          ))}
        </ScrollView>
      )}

      <TransactionDetailBottomSheet
        transaction={vm.selectedTransaction}
        isOpen={vm.isTransactionDetailOpen}
        onClose={vm.onCloseTransactionDetail}
      />
    </View>
  );
});

const listItemLx = { marginHorizontal: "-s8" as const };
const listItemContentStyle = { flex: 1, minWidth: 0 };

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBarContent: {
    textAlign: "center",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  filterWrapper: {
    position: "relative",
    zIndex: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dropdownMenu: {
    position: "absolute",
    top: 42,
    left: 0,
    minWidth: 130,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 20,
    elevation: 10,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionBlock: {
    gap: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionList: {
    marginHorizontal: -8,
  },
  merchantLogo: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
});

export default BaanxTransactionHistoryView;
