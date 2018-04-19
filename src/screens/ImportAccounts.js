/* @flow */
import React, { Component } from "react";
import {
  Switch,
  ScrollView,
  View,
  SectionList,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import groupBy from "lodash/groupBy";
import { connect } from "react-redux";
import Camera from "react-native-camera";
import { genAddingOperationsInAccount } from "@ledgerhq/wallet-common/lib/mock/account";
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import CurrencyUnitValue from "../components/CurrencyUnitValue";
import LText from "../components/LText";
import BlueButton from "../components/BlueButton";
import { accountsSelector } from "../reducers/accounts";
import { updateAccount, addAccount } from "../actions/accounts";
import { pollRates } from "../actions/counterValues";

type Data = Array<mixed>;
type AccountData = ["account", string, string, number];
type Result = {
  accounts: AccountData[]
};

function parseChunksReducer(chunks: Data[], chunk: string): Data[] {
  try {
    const data = JSON.parse(chunk);
    if (!(data instanceof Array)) throw new Error("not an array");
    const [dataLength, index, type] = data;
    if (typeof dataLength !== "number" || dataLength <= 0) {
      throw new Error("invalid dataLength");
    }
    if (typeof index !== "number" || index < 0 || index >= dataLength) {
      throw new Error("invalid index");
    }
    if (typeof type !== "string" || !type) {
      throw new Error("invalid type");
    }
    if (chunks.length > 0 && data[0] !== chunks[0][0]) {
      throw new Error("different dataLength");
    }
    if (chunks.some(c => c[1] === index)) {
      // chunk already exists. we are just ignoring
      return chunks;
    }
    return chunks.concat([data]);
  } catch (e) {
    console.warn(`Invalid chunk ${e.message}. Got: ${chunk}`);
    return chunks;
  }
}

const areChunksComplete = (chunks: Data[]): boolean =>
  chunks.length > 0 && chunks[0][0] === chunks.length;

function filterAccounts(result: Data[]): AccountData[] {
  const accounts = [];
  for (const d of result) {
    const [type, id, name, coinType] = d;
    if (
      type === "account" &&
      typeof id === "string" &&
      typeof name === "string" &&
      typeof coinType === "number"
    ) {
      accounts.push([type, id, name, coinType]);
    }
  }
  return accounts;
}

function chunksToResult(rawChunks: Data[]): Result {
  const chunks = rawChunks
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map(chunk => chunk.slice(2));
  const accounts = filterAccounts(chunks);
  return { accounts };
}

class PresentResultItem extends Component<{
  account: Account,
  mode: *,
  checked: boolean,
  loading: boolean,
  importing: boolean,
  onSwitch: (boolean, Account) => void
}> {
  onSwitch = (checked: boolean) => {
    this.props.onSwitch(checked, this.props.account);
  };
  render() {
    const { account, checked, mode, loading, importing } = this.props;
    return (
      <View
        style={{
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {mode === "id" ? null : (
          <Switch
            onValueChange={this.onSwitch}
            value={checked}
            disabled={importing}
          />
        )}
        <LText semiBold style={{ paddingHorizontal: 10 }} numberOfLines={1}>
          {account.name}
        </LText>
        <View style={{ flex: 1 }} />
        <CurrencyUnitValue
          unit={account.unit}
          value={account.balance}
          showCode
          ltextProps={{
            numberOfLines: 1,
            style: {
              marginRight: 5
            }
          }}
        />
        {mode === "create" && loading ? <ActivityIndicator /> : null}
      </View>
    );
  }
}

type Item = {
  // current account, might be partially completed as sync happen in background
  account: Account,
  // create: account is a new entity to create
  // patch: account exists and need to be patched
  // id: account exists and nothing changes
  mode: "create" | "patch" | "id"
};

type Props = {
  result: Result,
  onDone: () => void,
  accounts: Account[],
  addAccount: Account => void,
  updateAccount: ($Shape<Account>) => void,
  pollRates: () => void
};
type State = {
  selectedAccounts: string[],
  items: Item[],
  importing: boolean,
  pendingImportingAccounts: { [_: string]: true }
};

const itemModeDisplaySort = {
  create: 1,
  patch: 2,
  id: 3
};

class PresentResult_ extends Component<Props, State> {
  state = {
    selectedAccounts: [],
    items: [],
    importing: false,
    pendingImportingAccounts: {}
  };

  unmounted = false;

  componentDidMount() {
    this.checkForNewAccountSync();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  componentDidUpdate() {
    this.checkForNewAccountSync();
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const pendingImportingAccounts = { ...prevState.pendingImportingAccounts };
    const items = nextProps.result.accounts
      .map(accTuple => {
        const id = accTuple[1];
        const prevItem = prevState.items.find(item => item.account.id === id);
        if (prevItem) return prevItem;
        const [, , name, coinType] = accTuple;
        const existingAccount = nextProps.accounts.find(a => a.id === id);
        if (existingAccount) {
          // only the name is supposed to change. rest is never changing
          if (existingAccount.name === name) {
            return {
              account: existingAccount,
              mode: "id"
            };
          }
          return {
            account: { ...existingAccount, name },
            mode: "patch"
          };
        }
        const currency = getCurrencyByCoinType(coinType);
        const account = {
          id,
          name,
          coinType,
          currency,
          // these fields will be completed as we will sync
          address: "",
          balance: 0,
          operations: [],
          archived: false,
          unit: currency.units[0]
        };
        pendingImportingAccounts[id] = true;
        return { account, mode: "create" };
      })
      .sort(
        (a, b) => itemModeDisplaySort[a.mode] - itemModeDisplaySort[b.mode]
      );
    return { items, pendingImportingAccounts };
  }

  onImport = async () => {
    const { selectedAccounts, items } = this.state;
    const { onDone, addAccount, updateAccount, pollRates } = this.props;
    this.setState({ importing: true });
    const selectedItems = items.filter(item =>
      selectedAccounts.includes(item.account.id)
    );
    await Promise.all(
      selectedItems.map(
        item => this.mockAccountInSync[item.account.id] || Promise.resolve()
      )
    );

    // FIXME we need an action: importAccounts: that do all the following in more efficient way:
    // await importAccounts(selectedItems); // TODO
    for (const { mode, account } of selectedItems) {
      switch (mode) {
        case "create":
          await addAccount(account);
          break;
        case "patch":
          await updateAccount({ id: account.id, name: account.name });
          break;
        default:
      }
    }
    await pollRates();
    // ////////////////////////////////////////////////

    onDone();
  };

  onSwitchResultItem = (checked: boolean, account: Account) => {
    if (checked) {
      this.setState(({ selectedAccounts }) => ({
        selectedAccounts: selectedAccounts.concat(account.id)
      }));
    } else {
      this.setState(({ selectedAccounts }) => ({
        selectedAccounts: selectedAccounts.filter(s => s !== account.id)
      }));
    }
  };

  mockAccountInSync = {};
  generateSetStateMockFn = (id: string, i: number, iterations: number) => (
    state: State
  ) => {
    let { items, pendingImportingAccounts } = state;
    items = items.slice(0);
    let accountItem = items.find(item => item.account.id === id);
    if (!accountItem) return null;
    const index = items.indexOf(accountItem);
    accountItem = {
      ...accountItem,
      account: genAddingOperationsInAccount(
        accountItem.account,
        Math.floor(1 + 20 * Math.random()),
        `${accountItem.account.id}_${accountItem.account.operations.length}`
      )
    };
    items[index] = accountItem;
    if (i === iterations - 1) {
      pendingImportingAccounts = { ...pendingImportingAccounts };
      delete pendingImportingAccounts[id];
    }
    return { items, pendingImportingAccounts };
  };

  checkForNewAccountSync = () => {
    Object.keys(this.state.pendingImportingAccounts).forEach(id => {
      if (id in this.mockAccountInSync) return;
      this.mockAccountInSync[id] = Promise.resolve().then(async () => {
        const accountItem = this.state.items.find(
          item => item.account.id === id
        );
        if (!accountItem) return;
        const delay = ms => new Promise(success => setTimeout(success, ms));
        // using mocks, we will fakely generate mock transaction over time
        const iterations = 20;
        for (let i = 0; i < iterations; i++) {
          if (this.unmounted) return;
          this.setState(this.generateSetStateMockFn(id, i, iterations));
          await delay(100 + 200 * Math.random());
        }
      });
    });
  };

  renderItem = ({ item: { account, mode } }) => (
    <PresentResultItem
      key={account.id}
      account={account}
      mode={mode}
      checked={this.state.selectedAccounts.some(s => s === account.id)}
      onSwitch={this.onSwitchResultItem}
      loading={account.id in this.state.pendingImportingAccounts}
      importing={this.state.importing}
    />
  );

  renderSectionHeader = ({ section: { mode, data } }) => {
    let text;
    switch (mode) {
      case "create":
        text = `${data.length} new accounts`;
        break;
      case "patch":
        text = `${data.length} accounts with new changes`;
        break;
      case "id":
        text = `${data.length} accounts already imported`;
        break;
      default:
        text = "";
    }
    return <LText bold>{text}</LText>;
  };

  ListFooterComponent = () =>
    this.state.selectedAccounts.length === 0 ? null : (
      <BlueButton title="Import" onPress={this.onImport} />
    );

  SectionSeparatorComponent = () => <View style={{ height: 20 }} />;

  keyExtractor = item => item.account.id;

  render() {
    const { onDone } = this.props;
    const { items } = this.state;

    const itemsGroupedByMode = groupBy(items, "mode");

    return (
      <ScrollView contentContainerStyle={styles.presentResult}>
        {items.length === 0 ? (
          <View>
            <LText bold>Nothing to import.</LText>
            <BlueButton title="Done" onPress={onDone} />
          </View>
        ) : (
          <SectionList
            renderItem={this.renderItem}
            renderSectionHeader={this.renderSectionHeader}
            keyExtractor={this.keyExtractor}
            SectionSeparatorComponent={this.SectionSeparatorComponent}
            ListFooterComponent={this.ListFooterComponent}
            sections={Object.keys(itemsGroupedByMode).map(mode => ({
              mode,
              data: itemsGroupedByMode[mode]
            }))}
          />
        )}
      </ScrollView>
    );
  }
}
const PresentResult = connect(
  state => ({ accounts: accountsSelector(state) }),
  {
    addAccount,
    updateAccount,
    pollRates
  }
)(PresentResult_);

class Scanning extends Component<{
  onResult: Result => void
}> {
  lastData: ?string = null;
  chunks: Data[] = [];
  completed: boolean = false;
  onBarCodeRead = ({ data }: { data: string }) => {
    if (data && data !== this.lastData && !this.completed) {
      this.lastData = data;
      this.chunks = parseChunksReducer(this.chunks, data);
      if (areChunksComplete(this.chunks)) {
        this.completed = true;
        // TODO read the chunks version and check it's correctly supported (if newers version, we deny the import with an error)
        this.props.onResult(chunksToResult(this.chunks));
      }
    }
  };

  render() {
    // TODO some instruction on screen
    return (
      <Camera
        style={styles.camera}
        aspect={Camera.constants.Aspect.fill}
        onBarCodeRead={this.onBarCodeRead}
      />
    );
  }
}

class Intro extends Component<{
  onAccept: () => void
}> {
  render() {
    const { onAccept } = this.props;
    return (
      <View style={styles.body}>
        <LText style={styles.headHelp}>
          Please open Ledger Live desktop application and go to{" "}
          <LText bold>
            Settings {">"} Tools {">"} QRCode Mobile Export
          </LText>.
        </LText>
        <BlueButton title="Scan the QR Code" onPress={onAccept} />
      </View>
    );
  }
}

class ImportAccounts extends Component<
  {
    navigation: *
  },
  {
    result: ?Result,
    accepted: boolean
  }
> {
  static navigationOptions = {
    title: "Import Accounts"
  };

  state = {
    accepted: false,
    result: null
  };

  onAccept = () => {
    this.setState({ accepted: true });
  };

  onResult = (result: Result) => {
    this.setState({ result });
  };

  onDone = () => {
    this.props.navigation.goBack();
  };

  render() {
    const { accepted, result } = this.state;

    return (
      <View style={styles.container}>
        {result ? (
          <PresentResult result={result} onDone={this.onDone} />
        ) : !accepted ? (
          <Intro onAccept={this.onAccept} />
        ) : (
          <Scanning onResult={this.onResult} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  body: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  },
  headHelp: {
    marginBottom: 20
  },
  camera: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "flex-end",
    alignItems: "center",
    alignSelf: "stretch"
  },
  presentResult: {
    padding: 20
  }
});

export default ImportAccounts;
