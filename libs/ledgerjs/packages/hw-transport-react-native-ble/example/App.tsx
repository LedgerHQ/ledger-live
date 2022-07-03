import React, {useEffect, useCallback} from 'react';
import {from, Observable} from 'rxjs';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import BleTransport from '@ledgerhq/hw-transport-react-native-ble';
import {log, listen} from '@ledgerhq/logs';
import {withDevice} from '@ledgerhq/live-common/lib/hw/deviceAccess';

export default function App() {
  const [entries, setEntries] = React.useState<string[]>([]);
  const [apdu, onSetAPDU] = React.useState('b001000000');
  const [uuid, onSetUuid] = React.useState(null);
  const [logs, setLogs] = React.useState<string[]>([]);

  useEffect(() => {
    listen(({type, message}) => {
      setLogs(l => [JSON.stringify({type, message}), ...l]);
    });
  }, []);

  const onStart = useCallback(() => {
    setEntries([]);
    const sub = new Observable(s => BleTransport.listen(s)).subscribe({
      next: entry => setEntries(currentEntries => [entry, ...currentEntries]),
    });
    return () => {
      sub.ubsubscribe();
    };
  }, []);

  const onDisconnect = useCallback(() => {
    BleTransport.disconnect().then(() => {
      log('ble-verbose', 'disconnected'); // TODO move to transport?
      onSetUuid(null);
    });
  }, []);

  /// Atomic exchanges are by nature async since the action may
  /// take some time to resolve and can even be blocking, however, since this is
  /// using live-common and the device access paradigm we defer the connection
  /// opening to the `withDevice` call, as well as the device disconnection when
  /// the task is completed.
  const onExchange = useCallback(() => {
    if (!uuid) {
      return;
    }

    async function exchange() {
      try {
        await withDevice(uuid)(t => {
          return from(t.exchange(apdu));
        }).toPromise();
      } catch (e) {
        log('error', e);
      }
    }
    exchange();
  }, [apdu, uuid]);

  /// This triggers a long running task on the device, these tasks open a
  /// connection with one of our script runners and (after a secure handshake)
  /// exchange a series of APDU messages installing/uninstalling/etc binaries
  const onInstallBTC = useCallback(() => {
    if (!uuid) {
      return;
    }
    log('ble-verbose', 'Requesting a long running task');
    let url =
      'wss://scriptrunner.api.live.ledger.com/update/install?' +
      'targetId=855638020' +
      '&perso=perso_11' +
      '&firmware=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4' +
      '&firmwareKey=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4_key' +
      '&hash=8bf06e39e785ba5a8cf27bfa95036ccab02d756f8b8f44c3c3137fd035d5cb0c' +
      '&livecommonversion=22.0.0';

    // Long running task init, we can't rely on the completion, it's the completion of the request
    (async function exchange() {
      await withDevice(uuid)(_ => from([BleTransport.runner(url)])).toPromise();
    })();
  }, [uuid]);

  /// (cont from above) they can be started in the foreground and then backgrounded
  /// meaning the application does not need to remain in the foreground of the phone
  /// since all the APDU logic is handled on the native side which is not paused.
  const onUninstallBTC = useCallback(() => {
    if (!uuid) {
      return;
    }
    log('ble-verbose', 'Requesting a long running task');
    let url =
      'wss://scriptrunner.api.live.ledger.com/update/install?' +
      'targetId=855638020' +
      '&perso=perso_11' +
      '&firmware=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4_del' +
      '&firmwareKey=nanox%2F2.0.2-2%2Fbitcoin%2Fapp_2.0.4_del_key' +
      '&hash=8bf06e39e785ba5a8cf27bfa95036ccab02d756f8b8f44c3c3137fd035d5cb0c' +
      '&livecommonversion=22.0.0';

    // Long running task init, we can't rely on the completion, it's the completion of the request
    (async function exchange() {
      await withDevice(uuid)(_ => from([BleTransport.runner(url)])).toPromise();
    })();
  }, [uuid]);

  /// This triggers a queue.
  /// You can think of a queue in this context as a series of scriptrunners that will
  /// be resolved by a backend and that we handle in sequence on our native side.
  /// As of today, we are lacking the queue resolution part from backend and are emulating it.
  const onQueue = useCallback(() => {
    if (!uuid) {
      return;
    }
    log('ble-verbose', 'Requesting a long running task, queue');

    (async function exchange() {
      // This token installs eth and btc
      const token =
        'ewoJInNpZCI6ICIwMWYxYjViNi00MDgyLTQyN2EtOGNiYS1kODQyZTNiYmM0NmQiLAoJImNyZWF0ZWQiOiBbewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCgkJewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAp7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKCQl7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCnsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAoJCXsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCgkJewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAp7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKCQl7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCnsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAoJCXsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCgkJewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAp7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKCQl7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCnsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAoJCXsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKewoJCQkib3BlcmF0aW9uIjogImluc3RhbGwiLAoJCQkiYXBwIjogMTgxNTMsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LCB7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sCgkJewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJ1bmluc3RhbGwiLAoJCQkiYXBwIjogMTc2NTAsCgkJCSJ0YXJnZXRJZCI6IDg1NTYzODAyMCwKCQkJImxpdmVDb21tb25WZXJzaW9uIjogIiIKCQl9LAp7CgkJCSJvcGVyYXRpb24iOiAiaW5zdGFsbCIsCgkJCSJhcHAiOiAxODE1MywKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0sIHsKCQkJIm9wZXJhdGlvbiI6ICJpbnN0YWxsIiwKCQkJImFwcCI6IDE3NjUwLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwKCQl7CgkJCSJvcGVyYXRpb24iOiAidW5pbnN0YWxsIiwKCQkJImFwcCI6IDE4MTUzLAoJCQkidGFyZ2V0SWQiOiA4NTU2MzgwMjAsCgkJCSJsaXZlQ29tbW9uVmVyc2lvbiI6ICIiCgkJfSwgewoJCQkib3BlcmF0aW9uIjogInVuaW5zdGFsbCIsCgkJCSJhcHAiOiAxNzY1MCwKCQkJInRhcmdldElkIjogODU1NjM4MDIwLAoJCQkibGl2ZUNvbW1vblZlcnNpb24iOiAiIgoJCX0KCV0KfQ==';
      const index = 0;

      await withDevice(uuid)(_ =>
        from([BleTransport.queue(token, index)]),
      ).toPromise();
    })();
  }, [uuid]);

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.header,
          {backgroundColor: uuid ? '#e6f2ca' : '#F3BFC3'},
        ]}>
        {'BleTransport RN Module'}
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onStart}>
          <Text>{'Scan'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onDisconnect}>
          <Text style={!uuid ? styles.disabled : {}}>{'Disc.'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onExchange}>
          <Text style={!uuid ? styles.disabled : {}}>{'Send'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.button}>
        <TextInput style={styles.input} onChangeText={onSetAPDU} value={apdu} />
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={onInstallBTC}>
          <Text style={!uuid ? styles.disabled : {}}>{'Install BTC'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onUninstallBTC}>
          <Text style={!uuid ? styles.disabled : {}}>{'Uninstall BTC'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onQueue}>
          <Text style={!uuid ? styles.disabled : {}}>{'Consume Queue'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>{'Visible devices (click to select)'}</Text>
      <View style={styles.wrapper}>
        {entries.map(({uuid, name}) => (
          <TouchableOpacity
            key={uuid}
            style={[styles.btn, {flex: 0}]}
            onPress={() => onSetUuid(uuid)}>
            <Text>{`${name} - ${uuid}`}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.header}>{'Logs'}</Text>
      <View style={[styles.wrapper, {flex: 3}]}>
        <ScrollView>
          {logs.map((e, i) => (
            <Text key={`log_${i}`}>{e}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  disabled: {
    color: '#ccc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#eeeeee',
    width: '100%',
    borderColor: 'black',
    borderWidth: 1,
  },
  buttons: {
    flexDirection: 'row',
    padding: 10,
  },
  btn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  wrapper: {
    padding: 8,
    flex: 1,
    width: '100%',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
