/* @flow */
import React, { Component } from "react";
import Touchable from "../components/Touchable";
import TabIcon from "../components/TabIcon";
import CreateModal from "../modals/Create";
import TransferIcon from "../icons/Transfer";
import ExchangeScreen from "./Partners";

const hitSlop = {
  top: 10,
  left: 25,
  right: 25,
  bottom: 25,
};

class Transfer extends Component<
  { tintColor: string, navigation: * },
  { isModalOpened: boolean },
> {
  state = {
    isModalOpened: false,
  };

  openModal = () => this.setState({ isModalOpened: true });

  onModalClose = () => this.setState({ isModalOpened: false });

  isDisabled() {
    const { navigation } = this.props;
    const n =
      navigation &&
      navigation.dangerouslyGetParent &&
      navigation.dangerouslyGetParent();
    if (n && n.state) {
      const { state } = n;
      return (
        state.routes[state.index].params &&
        state.routes[state.index].params.blockNavigation
      );
    }

    return false;
  }

  render() {
    const { isModalOpened } = this.state;
    return (
      <>
        <Touchable
          event="Transfer"
          disabled={this.isDisabled()}
          hitSlop={hitSlop}
          onPress={this.openModal}
        >
          {/* $FlowFixMe */}
          <TabIcon
            Icon={TransferIcon}
            i18nKey="tabs.transfer"
            {...this.props}
          />
        </Touchable>
        <CreateModal isOpened={isModalOpened} onClose={this.onModalClose} />
      </>
    );
  }
}

export default class Create extends Component<*> {
  static navigationOptions = (navOpts: { navigation: * }) => ({
    tabBarIcon: (props: *) => (
      <Transfer {...props} navigation={navOpts.navigation} />
    ),
    tabBarOnPress: () => {}, // noop
  });

  render() {
    const { ...props } = this.props;
    return <ExchangeScreen {...props} />;
  }
}
