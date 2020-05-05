// @flow
import React, { Component } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import LText from "../components/LText";
import colors from "../colors";
import FaceID from "../icons/FaceID";
import Wrench from "../icons/Wrench";
import ExternalLink from "../icons/ExternalLink";
import LiveLogoIcon from "../icons/LiveLogoIcon";
import FaceIDFailed from "../icons/FaceIDFailed";
import Send from "../icons/Send";
import Fingerprint from "../icons/Fingerprint";
import QRcode from "../icons/QRcode";
import ArrowRight from "../icons/ArrowRight";
import Display from "../icons/Display";
import Truck from "../icons/Truck";
import SettingsIcon from "../icons/SettingsIcon";
import Warning from "../icons/Warning";
import LiveLogo from "../icons/LiveLogo";
import Exchange from "../icons/Exchange";
import CheckCircle from "../icons/CheckCircle";
import TabNanoX from "../icons/TabNanoX";
import Import from "../icons/Import";
import AlertTriangle from "../icons/AlertTriangle";
import NanoSVertical from "../icons/NanoSVertical";
import PortfolioNoOpIllustration from "../icons/PortfolioNoOpIllustration";
import Accounts from "../icons/Accounts";
import NanoXHorizontalBig from "../icons/NanoXHorizontalBig";
import Receive from "../icons/Receive";
import Check from "../icons/Check";
import Close from "../icons/Close";
import Help from "../icons/Help";
import DeviceIconBack from "../icons/DeviceIconBack";
import Info from "../icons/Info";
import QRcodeZoom from "../icons/QRcodeZoom";
import FallbackCamera from "../icons/FallbackCamera";
import NanoX from "../icons/NanoX";
import NanoXVertical from "../icons/NanoXVertical";
import TouchID from "../icons/TouchID";
import ArrowLeft from "../icons/ArrowLeft";
import Confetti3 from "../icons/confetti/confetti3";
import Confetti2 from "../icons/confetti/confetti2";
import Confetti1 from "../icons/confetti/confetti1";
import Confetti4 from "../icons/confetti/confetti4";
import Wallet from "../icons/Wallet";
import RecoveryPhrase from "../icons/RecoveryPhrase";
import Alert from "../icons/Alert";
import History from "../icons/History";
import Manager from "../icons/Manager";
import ImportDesktopAccounts from "../icons/ImportDesktopAccounts";
import NoLocationImage from "../icons/NoLocationImage";
import EmptyAccountsIllustration from "../icons/EmptyAccountsIllustration";
import ArrowUp from "../icons/ArrowUp";
import Portfolio from "../icons/Portfolio";
import Blue from "../icons/Blue";
import DeviceIconCheck from "../icons/DeviceIconCheck";
import Transfer from "../icons/Transfer";
import Trash from "../icons/Trash";
import Location from "../icons/Location";
import LedgerLogoRec from "../icons/LedgerLogoRec";
import Search from "../icons/Search";
import Archive from "../icons/Archive";
import ArrowDown from "../icons/ArrowDown";
import Settings from "../icons/Settings";
import Assets from "../icons/Assets";
import Pause from "../icons/Pause";
/* THIS FILE IS GENERATED, DO NOT EDIT */
class DebugSVG extends Component<{}> {
  icons = (): Array<Object> =>
    [
      { name: "FaceID", bitmap: 0, square: 1, component: FaceID },
      { name: "Wrench", bitmap: 0, square: 1, component: Wrench },
      { name: "ExternalLink", bitmap: 0, square: 1, component: ExternalLink },
      { name: "LiveLogoIcon", bitmap: 0, square: 1, component: LiveLogoIcon },
      { name: "FaceIDFailed", bitmap: 0, square: 1, component: FaceIDFailed },
      { name: "Send", bitmap: 0, square: 1, component: Send },
      { name: "Fingerprint", bitmap: 0, square: 1, component: Fingerprint },
      { name: "QRcode", bitmap: 0, square: 1, component: QRcode },
      { name: "ArrowRight", bitmap: 0, square: 1, component: ArrowRight },
      { name: "Display", bitmap: 0, square: 1, component: Display },
      { name: "Truck", bitmap: 0, square: 1, component: Truck },
      { name: "SettingsIcon", bitmap: 0, square: 0, component: SettingsIcon },
      { name: "Warning", bitmap: 0, square: 1, component: Warning },
      { name: "LiveLogo", bitmap: 0, square: 1, component: LiveLogo },
      { name: "Exchange", bitmap: 0, square: 1, component: Exchange },
      { name: "CheckCircle", bitmap: 0, square: 0, component: CheckCircle },
      { name: "TabNanoX", bitmap: 0, square: 1, component: TabNanoX },
      { name: "Import", bitmap: 0, square: 1, component: Import },
      { name: "AlertTriangle", bitmap: 0, square: 1, component: AlertTriangle },
      { name: "NanoSVertical", bitmap: 0, square: 0, component: NanoSVertical },
      {
        name: "PortfolioNoOpIllustration",
        bitmap: 0,
        square: 0,
        component: PortfolioNoOpIllustration,
      },
      { name: "Accounts", bitmap: 0, square: 1, component: Accounts },
      {
        name: "NanoXHorizontalBig",
        bitmap: 0,
        square: 0,
        component: NanoXHorizontalBig,
      },
      { name: "Receive", bitmap: 0, square: 1, component: Receive },
      { name: "Check", bitmap: 0, square: 1, component: Check },
      { name: "Close", bitmap: 0, square: 1, component: Close },
      { name: "Help", bitmap: 0, square: 1, component: Help },
      {
        name: "DeviceIconBack",
        bitmap: 0,
        square: 0,
        component: DeviceIconBack,
      },
      { name: "Info", bitmap: 0, square: 1, component: Info },
      { name: "QRcodeZoom", bitmap: 0, square: 1, component: QRcodeZoom },
      {
        name: "FallbackCamera",
        bitmap: 0,
        square: 0,
        component: FallbackCamera,
      },
      { name: "NanoX", bitmap: 0, square: 0, component: NanoX },
      { name: "NanoXVertical", bitmap: 0, square: 0, component: NanoXVertical },
      { name: "TouchID", bitmap: 0, square: 1, component: TouchID },
      { name: "ArrowLeft", bitmap: 0, square: 1, component: ArrowLeft },
      { name: "Confetti3", bitmap: 0, square: 1, component: Confetti3 },
      { name: "Confetti2", bitmap: 0, square: 1, component: Confetti2 },
      { name: "Confetti1", bitmap: 0, square: 1, component: Confetti1 },
      { name: "Confetti4", bitmap: 0, square: 1, component: Confetti4 },
      { name: "Wallet", bitmap: 0, square: 1, component: Wallet },
      {
        name: "RecoveryPhrase",
        bitmap: 0,
        square: 0,
        component: RecoveryPhrase,
      },
      { name: "Alert", bitmap: 0, square: 1, component: Alert },
      { name: "History", bitmap: 0, square: 1, component: History },
      { name: "Manager", bitmap: 0, square: 1, component: Manager },
      {
        name: "ImportDesktopAccounts",
        bitmap: 0,
        square: 0,
        component: ImportDesktopAccounts,
      },
      {
        name: "NoLocationImage",
        bitmap: 0,
        square: 0,
        component: NoLocationImage,
      },
      {
        name: "EmptyAccountsIllustration",
        bitmap: 0,
        square: 0,
        component: EmptyAccountsIllustration,
      },
      { name: "ArrowUp", bitmap: 0, square: 0, component: ArrowUp },
      { name: "Portfolio", bitmap: 0, square: 1, component: Portfolio },
      { name: "Blue", bitmap: 0, square: 0, component: Blue },
      {
        name: "DeviceIconCheck",
        bitmap: 0,
        square: 0,
        component: DeviceIconCheck,
      },
      { name: "Transfer", bitmap: 0, square: 1, component: Transfer },
      { name: "Trash", bitmap: 0, square: 1, component: Trash },
      { name: "Location", bitmap: 0, square: 0, component: Location },
      { name: "LedgerLogoRec", bitmap: 0, square: 0, component: LedgerLogoRec },
      { name: "Search", bitmap: 0, square: 1, component: Search },
      { name: "Archive", bitmap: 0, square: 1, component: Archive },
      { name: "ArrowDown", bitmap: 0, square: 0, component: ArrowDown },
      { name: "Settings", bitmap: 0, square: 1, component: Settings },
      { name: "Assets", bitmap: 0, square: 1, component: Assets },
      { name: "Pause", bitmap: 0, square: 1, component: Pause },
    ].sort((c1, c2) => (c1.name > c2.name ? -1 : 1));

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView>
          <View style={styles.wrapper}>
            {this.icons().map(iconObj => (
              <View
                style={[
                  styles.card,
                  iconObj.bitmap ? styles.bitmap : "",
                  !iconObj.square ? styles.notsquare : "",
                ]}
                key={iconObj.name}
              >
                <iconObj.component />
                <LText style={styles.text}>{iconObj.name}</LText>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  wrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    alignItems: "center",
    padding: 16,
    margin: 1,
    borderWidth: 0.5,
    borderColor: colors.lightFog,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bitmap: {
    borderTopColor: colors.alert,
    borderLeftColor: colors.alert,
  },
  notsquare: {
    borderColor: colors.live,
  },
  text: {
    padding: 4,
    textAlign: "center",
  },
});
export default DebugSVG;
