/* @flow */
import React, { Component } from "react";
import { SectionList, RefreshControl, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import { groupAccountOperationsByDay } from "@ledgerhq/wallet-common/lib/helpers/account";
import OperationRow from "./OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";

type Props = {
  Header: *,
  account: Account,
  visible?: boolean,
  onScroll?: (*) => void
};

type State = {
  refreshing: boolean,
  opCount: number,
  account: Account
};

class AccountBody extends Component<Props, State> {
  state = {
    refreshing: false,
    opCount: 20,
    account: this.props.account
  };

  static getDerivedStateFromProps(
    { account }: Props,
    prevState: State
  ): $Shape<State> {
    if (account !== prevState.account) {
      return { account, opCount: 20 };
    }
    return null;
  }

  sectionList: ?SectionList<*>;
  onSectionListRef = (ref: ?SectionList<*>) => {
    this.sectionList = ref;
  };

  componentDidUpdate(prevProps: Props) {
    // when list become unvisible, we want to scroll it on top again for when we come back
    if (prevProps.visible && !this.props.visible) {
      this.scrollUp(false);
    }
  }

  scrollUp(animated: boolean = true) {
    const { sectionList } = this;
    if (sectionList) {
      sectionList.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 340,
        animated
      });
    }
  }

  onRefresh = () => {
    this.setState({ refreshing: true, opCount: 20 });
    new Promise(s => setTimeout(s, 500 + 500 * Math.random())).then(() => {
      this.setState({ refreshing: false });
    });
  };

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  keyExtractor = (item: *) => item.id;

  renderItem = ({ item }: *) => (
    <OperationRow operation={item} account={this.props.account} />
  );

  render() {
    const { Header, account, visible, onScroll } = this.props;
    const { refreshing, opCount } = this.state;
    const operationsByDay = groupAccountOperationsByDay(account, opCount);
    const sections: any = operationsByDay || [];
    return (
      <SectionList
        ref={this.onSectionListRef}
        style={[styles.root, !visible && { display: "none" }]}
        refreshControl={
          <RefreshControl
            tintColor="white"
            refreshing={refreshing}
            onRefresh={this.onRefresh}
          />
        }
        onEndReached={this.onEndReached}
        renderItem={this.renderItem}
        renderSectionHeader={SectionHeader}
        sections={sections}
        ListHeaderComponent={Header}
        ListFooterComponent={
          sections.length === 0 ? NoOperationFooter : NoMoreOperationFooter
        }
        keyExtractor={this.keyExtractor}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
      />
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});

export default AccountBody;
