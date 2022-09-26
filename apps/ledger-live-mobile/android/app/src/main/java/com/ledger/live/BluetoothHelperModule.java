package com.ledger.live;

import static com.ledger.live.Constants.REQUEST_ENABLE_BT;

import android.bluetooth.BluetoothAdapter;
import android.content.Intent;
import android.app.Activity;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;

import java.util.Map;
import java.util.HashMap;

public class BluetoothHelperModule extends ReactContextBaseJavaModule {

  private static final String E_ACTIVITY_DOES_NOT_EXIST = "E_ACTIVITY_DOES_NOT_EXIST";
  private static final String E_BLE_CANCELLED = "E_BLE_CANCELLED";

  private Promise blePromise;

  private final ActivityEventListener bleActivityEventListener = new BaseActivityEventListener() {

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      if (requestCode == REQUEST_ENABLE_BT) {
        if (blePromise != null) {
          if (resultCode == Activity.RESULT_CANCELED) {
            blePromise.reject(E_BLE_CANCELLED, "Ble activation was cancelled");
          } else if (resultCode == Activity.RESULT_OK) {
            blePromise.resolve(true);
          }

          blePromise = null;
        }
      }
    }
  };

  public BluetoothHelperModule(ReactApplicationContext context) {
    super(context);

    // Add the listener for `onActivityResult`
    context.addActivityEventListener(bleActivityEventListener);
  }

  @Override
  public String getName() {
    return "BluetoothHelperModule";
  }

  

  /*
   * check if bluetooth is available.
   */
  @ReactMethod
  public boolean isBluetoothAvailable() {
    BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    return bluetoothAdapter != null && bluetoothAdapter.isEnabled();
  }

  /*
   * Prompts the user to enable bluetooth if possible.
   */
  @ReactMethod
  public void prompt(Promise promise) {
    boolean isBLEAvailable = this.isBluetoothAvailable();

    if (!isBLEAvailable) {
      // Activity Action: Show a system activity that allows the user to turn on Bluetooth.
      // This system activity will return once Bluetooth has completed turning on, or the user has decided not to turn Bluetooth on.
      // See: https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#ACTION_REQUEST_ENABLE
      Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
      blePromise = promise;

      this.getCurrentActivity().startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
    } else {
      promise.resolve(true);
    }    
  }
}