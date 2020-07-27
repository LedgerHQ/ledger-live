/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Linking,
  TouchableOpacity,
  TextInput,
} from 'react-native';

const App: () => React$Node = () => {
  const redirect = url => () => Linking.openURL(url).catch(() => {});
  const [accountCurrency, setAccountCurrency] = useState('bitcoin');
  const [sendCurrency, setSendCurrency] = useState('bitcoin');
  const [receiveCurrency, setReceiveCurrency] = useState('bitcoin');
  const [buyCurrency, setBuyCurrency] = useState('bitcoin');

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={'#4b84ff19'} />
      <SafeAreaView style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>LLM - Deep Links 🔗</Text>
          <Text style={styles.subTitle}>
            Edit the parameters if needed then long press on each link to test
            them.
          </Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect('ledgerlive://')}>
            <Text style={styles.link}>ledgerlive://</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect('ledgerlive://account')}>
            <Text style={styles.link}>ledgerlive://account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect(
              'ledgerlive://account?currency=' + accountCurrency,
            )}>
            <Text style={styles.link}>ledgerlive://account?currency=</Text>
            <TextInput
              style={styles.input}
              value={accountCurrency}
              onChangeText={setAccountCurrency}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect('ledgerlive://send')}>
            <Text style={styles.link}>ledgerlive://send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect(
              'ledgerlive://send?currency=' + sendCurrency,
            )}>
            <Text style={styles.link}>ledgerlive://send?currency=</Text>
            <TextInput
              style={styles.input}
              value={sendCurrency}
              onChangeText={setSendCurrency}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect('ledgerlive://receive')}>
            <Text style={styles.link}>ledgerlive://receive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect(
              'ledgerlive://receive?currency=' + receiveCurrency,
            )}>
            <Text style={styles.link}>ledgerlive://receive?currency=</Text>
            <TextInput
              style={styles.input}
              value={receiveCurrency}
              onChangeText={setReceiveCurrency}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect('ledgerlive://buy')}>
            <Text style={styles.link}>ledgerlive://buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onLongPress={redirect('ledgerlive://buy/' + buyCurrency)}>
            <Text style={styles.link}>ledgerlive://buy/</Text>
            <TextInput
              style={styles.input}
              value={buyCurrency}
              onChangeText={setBuyCurrency}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {flexBasis: 100},
  body: {
    backgroundColor: '#4b84ff19',
    flex: 1,
  },
  button: {
    paddingHorizontal: 16,
    margin: 8,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'flex-start',
    borderRadius: 100,
  },
  separator: {
    height: 4,
    width: 100,
    borderRadius: 5,
    backgroundColor: '#4b84ff19',
    alignSelf: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6490f1',
    width: 'auto',
    paddingTop: 16,
    paddingHorizontal: 32,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6490f1',
    width: 'auto',
    padding: 8,
    paddingHorizontal: 32,
  },
  input: {
    height: 50,
    fontWeight: 'bold',
    color: '#6490f1',
    right: 3,
  },
  link: {
    color: '#6490f1',
    lineHeight: 56,
  },
});

export default App;
