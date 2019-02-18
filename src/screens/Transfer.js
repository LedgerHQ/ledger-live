/* @flow */
import React, { Component, Fragment } from "react";
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
  { tintColor: string },
  { isModalOpened: boolean },
> {
  state = {
    isModalOpened: false,
  };

  openModal = () => this.setState({ isModalOpened: true });

  onModalClose = () => this.setState({ isModalOpened: false });

  render() {
    const { isModalOpened } = this.state;
    return (
      <Fragment>
        <Touchable event="Transfer" hitSlop={hitSlop} onPress={this.openModal}>
          {/* $FlowFixMe */}
          <TabIcon
            Icon={TransferIcon}
            i18nKey="tabs.transfer"
            {...this.props}
          />
        </Touchable>
        <CreateModal isOpened={isModalOpened} onClose={this.onModalClose} />
      </Fragment>
    );
  }
}

export default class Create extends Component<*> {
  static navigationOptions = {
    tabBarIcon: (props: *) => <Transfer {...props} />,
    tabBarOnPress: () => {}, // noop
  };

  render() {
    const { ...props } = this.props;
    return <ExchangeScreen {...props} />;
  }
}
