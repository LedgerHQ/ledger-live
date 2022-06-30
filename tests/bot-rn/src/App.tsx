import React, {useEffect} from 'react';
import Config from 'react-native-config';
import {listen, log} from '@ledgerhq/logs';
import {bot} from '@ledgerhq/live-common/lib/bot';
import {LogBox, Text, View} from 'react-native';
import {useState} from 'react';

let logger: WebSocket | undefined;
if (Config.BOT_LOG_SERVICE) {
  logger = new WebSocket(Config.BOT_LOG_SERVICE);
}

listen(info => {
  if (logger) {
    logger.send(JSON.stringify(info));
  } else {
    console.log(info);
  }
});

const launchBot = (setData: (returnValue: number) => void) => {
  try {
    const arg: {
      currency?: string;
      family?: string;
    } = {};

    if (Config.BOT_FILTER_CURRENCY) {
      arg.currency = Config.BOT_FILTER_CURRENCY;
    }

    if (Config.BOT_FILTER_FAMILY) {
      arg.family = Config.BOT_FILTER_FAMILY;
    }

    arg.family = 'algorand';

    bot(arg).then((result: number) => {
      console.log(result);
      setData(result);
    });
    // TODO inform upstream that it's finished
  } catch (e) {
    setData(-1);
    log('critical', String(e));
  }
};

// Ignore all log notifications:
LogBox.ignoreAllLogs();

const App = () => {
  const [data, setData] = useState(0);

  useEffect(() => {
    launchBot(setData);
  }, []);
  return (
    <View
      style={{height: '100%', alignItems: 'center', justifyContent: 'center'}}>
      {data === 0 ? (
        <Text>Bot is running. Check the main console.</Text>
      ) : (
        <Text testID="done">Bot has {data === -1 ? 'failed' : 'finished'}</Text>
      )}
    </View>
  );
};

export default App;
