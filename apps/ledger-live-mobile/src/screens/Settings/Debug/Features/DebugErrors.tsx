import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text, Icons, Flex } from "@ledgerhq/native-ui";
import {
  AccountNameRequiredError,
  AccountNotSupported,
  AmountRequired,
  BluetoothRequired,
  BtcUnmatchedApp,
  CantOpenDevice,
  CantScanQRCode,
  CashAddrNotSupported,
  CurrencyNotSupported,
  DeviceAppVerifyNotSupported,
  DeviceExtractOnboardingStateError,
  DeviceGenuineSocketEarlyClose,
  DeviceHalted,
  DeviceInOSUExpected,
  DeviceNameInvalid,
  DeviceNotGenuineError,
  DeviceOnboardingStatePollingError,
  DeviceOnDashboardExpected,
  DeviceOnDashboardUnexpected,
  DeviceShouldStayInApp,
  DeviceSocketFail,
  DeviceSocketNoBulkStatus,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  DustLimit,
  EnpointConfigError,
  ETHAddressNonEIP,
  EthAppPleaseEnableContractData,
  FeeEstimationFailed,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  FirmwareNotRecognized,
  FirmwareOrAppUpdateRequired,
  GasLessThanEstimate,
  GenuineCheckFailed,
  HardResetFail,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidXRPTag,
  LanguageNotFound,
  LedgerAPI4xx,
  LedgerAPI5xx,
  LedgerAPIError,
  LedgerAPIErrorWithMessage,
  LedgerAPINotAvailable,
  LockedDeviceError,
  ManagerAppAlreadyInstalledError,
  ManagerAppDepInstallRequired,
  ManagerAppDepUninstallRequired,
  ManagerAppRelyOnBTCError,
  ManagerDeviceLockedError,
  ManagerFirmwareNotEnoughSpaceError,
  ManagerNotEnoughSpaceError,
  ManagerUninstallBTCDep,
  MaxFeeTooLow,
  MCUNotGenuineToDashboard,
  NetworkDown,
  NoAccessToCamera,
  NoAddressesFound,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  NotEnoughBalanceToDelegate,
  NotEnoughGas,
  NotEnoughSpendableBalance,
  NotSupportedLegacyAddress,
  OpReturnDataSizeLimit,
  PairingFailed,
  PasswordIncorrectError,
  PasswordsDontMatchError,
  PendingOperation,
  PriorityFeeHigherThanMaxFee,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  RecipientRequired,
  RecommendSubAccountsToEmpty,
  RecommendUndelegation,
  SyncError,
  TimeoutTagged,
  TransportInterfaceNotAvailable,
  TransportOpenUserCancelled,
  TransportRaceCondition,
  UnavailableTezosOriginatedAccountReceive,
  UnavailableTezosOriginatedAccountSend,
  UnexpectedBootloader,
  UnknownMCU,
  UpdateFetchFileFail,
  UpdateIncorrectHash,
  UpdateIncorrectSig,
  UpdateYourApp,
  UserRefusedAddress,
  UserRefusedAllowManager,
  UserRefusedDeviceNameChange,
  UserRefusedFirmwareUpdate,
  UserRefusedOnDevice,
  WebsocketConnectionError,
  WebsocketConnectionFailed,
  WrongAppForCurrency,
  WrongDeviceForAccount,
} from "@ledgerhq/errors";
import { useNavigation, useTheme } from "@react-navigation/native";

import {
  ConnectAppTimeout,
  ConnectManagerTimeout,
  GetAppAndVersionUnsupportedFormat,
  AccountNeedResync,
  LatestFirmwareVersionRequired,
  LowerThanMinimumRelayFee,
  TransactionRefusedOnDevice,
  LanguageInstallRefusedOnDevice,
  ImageLoadRefusedOnDevice,
  ImageDoesNotExistOnDevice,
  ImageCommitRefusedOnDevice,
  LanguageInstallTimeout,
  DeviceNotOnboarded,
  InvalidAddressBecauseAlreadyDelegated,
  SourceHasMultiSign,
  CosmosRedelegationInProgress,
  ClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
  CosmosTooManyValidators,
  NotEnoughDelegationBalance,
  SatStackVersionTooOld,
  SatStackAccessDown,
  SatStackStillSyncing,
  SatStackDescriptorNotImported,
  SwapNoAvailableProviders,
  NoSuchAppOnProvider,
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLowOrTooHigh,
  SwapCheckKYCStatusFailed,
  SwapSubmitKYCFailed,
  SwapGenericAPIError,
  JSONRPCResponseError,
  JSONDecodeError,
  NoIPHeaderError,
  CurrencyNotSupportedError,
  CurrencyDisabledError,
  CurrencyDisabledAsInputError,
  CurrencyDisabledAsOutputError,
  CurrencyNotSupportedByProviderError,
  TradeMethodNotSupportedError,
  UnexpectedError,
  NotImplementedError,
  ValidationError,
  AccessDeniedError,
  AlgorandASANotOptInInRecipient,
  CompoundLowerAllowanceOfActiveAccountError,
  OutdatedApp,
  BluetoothNotSupportedError,
} from "@ledgerhq/live-common/errors";
import { useTranslation } from "react-i18next";

import QueuedDrawer from "../../../../components/QueuedDrawer";
import Touchable from "../../../../components/Touchable";
import Check from "../../../../icons/Check";
import GenericErrorBottomModal from "../../../../components/GenericErrorBottomModal";
import GenericErrorView from "../../../../components/GenericErrorView";
import FilteredSearchBar from "../../../../components/FilteredSearchBar";
import {
  LedgerError,
  errorsWithOverrides,
} from "../../../../hooks/useErrorRenderData";

/**
 * Allows us to easily take a look at the rendering any error triggers in both modal
 * and full screen modes. The complicated aspect of this is that some errors' CTA's
 * trigger complex logic that needs to be available on the calling context, ie if an
 * error can be triggered on a DeviceAction default rendering, it can't have anything
 * other than a `retry` but if it's handling the error in a specific component it can
 * provide the callbacks for the errors. It's complicated, you know?
 */
const SEARCH_KEYS = ["name"];

type Item = {
  Class: LedgerError;
  name: string;
  translationKey: string;
  hasTranslation?: boolean;
  hasOverride: boolean;
};

const keyExtractor = ({ name }: Item) => name;

const items: Item[] = [
  AccountNameRequiredError,
  AccountNotSupported,
  AmountRequired,
  BluetoothRequired,
  BtcUnmatchedApp,
  CantOpenDevice,
  CantScanQRCode,
  CashAddrNotSupported,
  CurrencyNotSupported,
  DeviceAppVerifyNotSupported,
  DeviceExtractOnboardingStateError,
  DeviceGenuineSocketEarlyClose,
  DeviceHalted,
  DeviceInOSUExpected,
  DeviceNameInvalid,
  DeviceNotGenuineError,
  DeviceOnboardingStatePollingError,
  DeviceOnDashboardExpected,
  DeviceOnDashboardUnexpected,
  DeviceShouldStayInApp,
  DeviceSocketFail,
  DeviceSocketNoBulkStatus,
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  DustLimit,
  EnpointConfigError,
  ETHAddressNonEIP,
  EthAppPleaseEnableContractData,
  FeeEstimationFailed,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  FirmwareNotRecognized,
  FirmwareOrAppUpdateRequired,
  GasLessThanEstimate,
  GenuineCheckFailed,
  HardResetFail,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidXRPTag,
  LanguageNotFound,
  LedgerAPI4xx,
  LedgerAPI5xx,
  LedgerAPIError,
  LedgerAPIErrorWithMessage,
  LedgerAPINotAvailable,
  LockedDeviceError,
  ManagerAppAlreadyInstalledError,
  ManagerAppDepInstallRequired,
  ManagerAppDepUninstallRequired,
  ManagerAppRelyOnBTCError,
  ManagerDeviceLockedError,
  ManagerFirmwareNotEnoughSpaceError,
  ManagerNotEnoughSpaceError,
  ManagerUninstallBTCDep,
  MaxFeeTooLow,
  MCUNotGenuineToDashboard,
  NetworkDown,
  NoAccessToCamera,
  NoAddressesFound,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  NotEnoughBalanceToDelegate,
  NotEnoughGas,
  NotEnoughSpendableBalance,
  NotSupportedLegacyAddress,
  OpReturnDataSizeLimit,
  PairingFailed,
  PasswordIncorrectError,
  PasswordsDontMatchError,
  PendingOperation,
  PriorityFeeHigherThanMaxFee,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  RecipientRequired,
  RecommendSubAccountsToEmpty,
  RecommendUndelegation,
  SyncError,
  TimeoutTagged,
  TransportInterfaceNotAvailable,
  TransportOpenUserCancelled,
  TransportRaceCondition,
  UnavailableTezosOriginatedAccountReceive,
  UnavailableTezosOriginatedAccountSend,
  UnexpectedBootloader,
  UnknownMCU,
  UpdateFetchFileFail,
  UpdateIncorrectHash,
  UpdateIncorrectSig,
  UpdateYourApp,
  UserRefusedAddress,
  UserRefusedAllowManager,
  UserRefusedDeviceNameChange,
  UserRefusedFirmwareUpdate,
  UserRefusedOnDevice,
  WebsocketConnectionError,
  WebsocketConnectionFailed,
  WrongAppForCurrency,
  WrongDeviceForAccount,
  // Live-common errors
  ConnectAppTimeout,
  ConnectManagerTimeout,
  GetAppAndVersionUnsupportedFormat,
  AccountNeedResync,
  LatestFirmwareVersionRequired,
  LowerThanMinimumRelayFee,
  TransactionRefusedOnDevice,
  LanguageInstallRefusedOnDevice,
  ImageLoadRefusedOnDevice,
  ImageDoesNotExistOnDevice,
  ImageCommitRefusedOnDevice,
  LanguageInstallTimeout,
  DeviceNotOnboarded,
  InvalidAddressBecauseAlreadyDelegated,
  SourceHasMultiSign,
  CosmosRedelegationInProgress,
  ClaimRewardsFeesWarning,
  CosmosDelegateAllFundsWarning,
  CosmosTooManyValidators,
  NotEnoughDelegationBalance,
  SatStackVersionTooOld,
  SatStackAccessDown,
  SatStackStillSyncing,
  SatStackDescriptorNotImported,
  SwapNoAvailableProviders,
  NoSuchAppOnProvider,
  SwapExchangeRateAmountTooLow,
  SwapExchangeRateAmountTooHigh,
  SwapExchangeRateAmountTooLowOrTooHigh,
  SwapCheckKYCStatusFailed,
  SwapSubmitKYCFailed,
  SwapGenericAPIError,
  JSONRPCResponseError,
  JSONDecodeError,
  NoIPHeaderError,
  CurrencyNotSupportedError,
  CurrencyDisabledError,
  CurrencyDisabledAsInputError,
  CurrencyDisabledAsOutputError,
  CurrencyNotSupportedByProviderError,
  TradeMethodNotSupportedError,
  UnexpectedError,
  NotImplementedError,
  ValidationError,
  AccessDeniedError,
  AlgorandASANotOptInInRecipient,
  CompoundLowerAllowanceOfActiveAccountError,
  OutdatedApp,
  BluetoothNotSupportedError,
].map((ErrorClass: LedgerError) => {
  const instance = new ErrorClass();
  const translationKey = `errors.${instance.name}.title`;
  return {
    Class: ErrorClass,
    name: instance.name,
    translationKey,
    hasOverride: errorsWithOverrides.includes(ErrorClass) || false,
  };
});

const DebugErrors = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const mappedAndSortedData: Item[] = items
    .map(item => ({
      ...item,
      hasTranslation: t(item.translationKey) === item.translationKey,
    }))
    .sort((a, b) => +a.hasTranslation - +b.hasTranslation)
    .sort((a, b) => +b.hasOverride - +a.hasOverride);

  const [isSelectorVisible, setIsSelectorVisible] = useState<boolean>(false);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [isInfoModal, setIsInfoModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<Item>(items[0]);

  const onSelectError = useCallback(item => {
    setSelectedItem(item);
    setIsModal(false);
    setIsSelectorVisible(false);
  }, []);

  const toggleIsModal = useCallback(() => {
    setIsModal(isModal => !isModal);
    setIsInfoModal(false);
  }, []);

  const toggleInfoModal = useCallback(() => {
    setIsInfoModal(isInfoModal => !isInfoModal);
    setIsModal(false);
  }, []);

  const toggleErrorSelector = useCallback(() => {
    setIsSelectorVisible(isSelectorVisible => !isSelectorVisible);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerRight: () => (
        <Flex flexDirection="row">
          <TouchableOpacity
            onPress={toggleInfoModal}
            style={styles.headerButton}
          >
            <Icons.InfoMedium size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="debug-errors-toggle"
            onPress={toggleIsModal}
            style={styles.headerButton}
          >
            <Icons.BringFrontMedium size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="debug-errors-selector"
            onPress={toggleErrorSelector}
            style={styles.headerButton}
          >
            <Icons.ListMedium size={24} />
          </TouchableOpacity>
        </Flex>
      ),
    });
  }, [navigation, toggleErrorSelector, toggleInfoModal, toggleIsModal]);

  const errorInstance = new selectedItem.Class(undefined, {});

  // Nb filler props for error debugging, in the real world, these would come from the
  // screen or flow using the GenericErrorView either directly or through DeviceAction.
  const extraArgs = {
    deviceName: "My Nano",
    productName: "Ledger Stax",
    managerAppName: "Cheese",
  };

  const renderItem = ({ item }: ListRenderItemInfo<Item>) => (
    <Touchable
      testID={item.name}
      key={item.name}
      onPress={() => onSelectError(item)}
      style={styles.button}
    >
      <Text
        color={
          item.translationKey === t(item.translationKey)
            ? "neutral.c50"
            : "neutral.c100"
        }
      >
        {item.hasOverride ? `*${item.name}` : item.name}
      </Text>
      {errorInstance instanceof item.Class && (
        <Check size={16} color={colors.live} />
      )}
    </Touchable>
  );

  const renderList = (items: Item[]) => (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      renderItem={renderItem as ListRenderItem<Item>}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    />
  );

  return (
    <Flex p={6} flex={1}>
      {isModal ? (
        <GenericErrorBottomModal
          error={errorInstance}
          onClose={setIsModal as () => void}
          args={extraArgs}
        />
      ) : (
        <GenericErrorView error={errorInstance} args={extraArgs} />
      )}
      <QueuedDrawer
        title="Select an error"
        isRequestingToBeOpened={isSelectorVisible}
        onClose={setIsSelectorVisible as () => void}
      >
        <Flex style={styles.modal}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.filteredSearchInputWrapperStyle}
            list={mappedAndSortedData}
            renderList={renderList}
            renderEmptySearch={() => (
              <Text style={styles.emptySearchText}>
                {"No errors matching search"}
              </Text>
            )}
          />
        </Flex>
      </QueuedDrawer>
      <QueuedDrawer
        title="Info"
        isRequestingToBeOpened={isInfoModal}
        onClose={setIsInfoModal as () => void}
      >
        <Flex style={styles.modal}>
          <Text>
            {
              "This tool allows us to see how an error will look in this app in both modal and fullscreen modes. The select on the top right will list all the errors that can be thrown.\n\n - Gray text means there's currently no translation for that particular error.\n\n - Errors with a leading asterisk * mean there's already some override on the rendering such as an icon change, color, different wording for the CTA, etc."
            }
          </Text>
        </Flex>
      </QueuedDrawer>
    </Flex>
  );
};

const styles = StyleSheet.create({
  modal: {
    height: 300,
  },
  headerButton: {
    padding: 8,
  },
  button: {
    margin: 8,
    borderRadius: 4,
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 8,
    flexDirection: "row",
  },
  list: {
    paddingBottom: 32,
  },
  filteredSearchInputWrapperStyle: {
    marginHorizontal: 16,
  },
  emptySearchText: {
    textAlign: "center",
  },
});

export default DebugErrors;
