import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { StyleSheet, Dimensions, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import VersionNumber from "react-native-version-number";
import { createStructuredSelector } from "reselect";
import { encode, Settings } from "@ledgerhq/live-common/cross";
import { dataToFrames } from "qrloop";
import { Account } from "@ledgerhq/types-live";
import { accountsSelector } from "../../../reducers/accounts";
import { exportSettingsSelector } from "../../../reducers/settings";
import LText from "../../../components/LText";
import NavigationScrollView from "../../../components/NavigationScrollView";
import { State } from "../../../reducers/types";

export type Props = {
  accounts: Account[];
  settings: Settings;
  children?: React.ReactNode;
};

class ExportAccounts extends PureComponent<
  Props,
  {
    frame: number;
  }
> {
  state = {
    frame: 0,
  };
  chunks: string[] | undefined;
  timer: NodeJS.Timeout | undefined;

  componentDidMount() {
    const { accounts, settings } = this.props;
    const data = encode({
      accounts,
      settings,
      exporterName: "mobile",
      exporterVersion: VersionNumber.appVersion || "",
    });
    this.chunks = dataToFrames(data, 160, 4);
    const fps = 3;

    const animate = () => {
      this.setState(state => {
        if (!this.chunks) return state;
        const { frame } = state;
        if (frame < this.chunks.length - 1)
          return {
            frame: frame + 1,
          };
        return {
          frame: 0,
        };
      });
      this.timer = setTimeout(animate, fps / 3);
    };

    this.timer = setTimeout(animate, fps / 3);
  }

  componentWillUnmount() {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
    }
  }

  render() {
    const { frame } = this.state;
    const d = Dimensions.get("window");
    const size = Math.min(d.width, d.height) - 16 * 2; // width - padding

    if (!this.chunks) return null;
    return (
      <NavigationScrollView>
        <View style={styles.qrContainer}>
          <QRCode size={size} value={this.chunks[frame]} />
        </View>
        <LText style={styles.subText}>
          {frame + 1}
          {" / "}
          {this.chunks.length}
        </LText>
      </NavigationScrollView>
    );
  }
}

export default connect(
  createStructuredSelector<
    State,
    {
      accounts: Account[];
      settings: Settings;
    }
  >({
    accounts: accountsSelector,
    settings: exportSettingsSelector,
  }),
)(ExportAccounts);

const styles = StyleSheet.create({
  root: {
    padding: 16,
    alignItems: "center",
  },
  qrContainer: {
    backgroundColor: "#FFF",
    padding: 5,
  },
  subText: {
    paddingTop: 32,
  },
});
