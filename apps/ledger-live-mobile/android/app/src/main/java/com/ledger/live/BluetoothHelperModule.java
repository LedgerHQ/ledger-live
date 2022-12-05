package com.ledger.live;

import static com.ledger.live.Constants.REQUEST_ENABLE_BT;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;
import java.util.Map;

public class BluetoothHelperModule extends ReactContextBaseJavaModule {

  private static String TAG = "BluetoothHelperModule";

  private static final String E_ACTIVITY_DOES_NOT_EXIST = "E_ACTIVITY_DOES_NOT_EXIST";
  private static final String E_BLE_CANCELLED = "E_BLE_CANCELLED";
  private static final String E_SECURITY_EXCEPTION = "E_SECURITY_EXCEPTION";
  private static final String E_UNKNOWN_ERROR = "E_UNKNOWN_ERROR";
  private static final String E_ENABLE_BLE_UNKNOWN_RESPONSE = "E_ENABLE_BLE_UNKNOWN_RESPONSE";

  private Promise blePromise;

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("E_ACTIVITY_DOES_NOT_EXIST", E_ACTIVITY_DOES_NOT_EXIST);
    constants.put("E_BLE_CANCELLED", E_BLE_CANCELLED);
    constants.put("E_SECURITY_EXCEPTION", E_SECURITY_EXCEPTION);
    constants.put("E_UNKNOWN_ERROR", E_UNKNOWN_ERROR);
    constants.put("E_ENABLE_BLE_UNKNOWN_RESPONSE", E_ENABLE_BLE_UNKNOWN_RESPONSE);
    return constants;
  }

  private final ActivityEventListener bleActivityEventListener = new BaseActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      if (requestCode == REQUEST_ENABLE_BT) {
        if (blePromise != null) {
          if (resultCode == Activity.RESULT_CANCELED) {
            blePromise.reject(E_BLE_CANCELLED, "Ble activation was cancelled");
          } else if (resultCode == Activity.RESULT_OK) {
            blePromise.resolve(true);
          } else {
            blePromise.reject(E_ENABLE_BLE_UNKNOWN_RESPONSE, "Received an unknown response");
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

  private void enableBluetooth(Promise promise) {
    Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
    blePromise = promise;
    Activity activity = this.getCurrentActivity();
    if (activity == null) {
      blePromise.reject(E_ACTIVITY_DOES_NOT_EXIST, "Activity is null in enableBluetooth()");
      blePromise = null;
      return;
    }
    try {
      activity.startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
    } catch (SecurityException e) {
      blePromise.reject(E_SECURITY_EXCEPTION, "Permissions missing for enabling bluetooth", e);
      blePromise = null;
    }
  }

  /*
   * Prompts the user to enable bluetooth if possible.
   */
  @ReactMethod
  public void prompt(Promise promise) {
    try {
      // Activity Action: Show a system activity that allows the user to turn on Bluetooth.
      // This system activity will return once Bluetooth has completed turning on, or the user has decided not to turn Bluetooth on.
      // See: https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#ACTION_REQUEST_ENABLE
      if (isBluetoothAvailable()) {
        promise.resolve(true);
      } else {
        enableBluetooth(promise);
      }
    } catch(Exception e) {
      Log.e(TAG, "prompt: ", e);
      promise.reject(E_UNKNOWN_ERROR, e.getMessage(), e);
    }
  }

}