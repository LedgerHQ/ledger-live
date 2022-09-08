package com.ledger.live;

import static com.ledger.live.Constants.REQUEST_BT_PERMISSIONS;
import static com.ledger.live.Constants.REQUEST_ENABLE_BT;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class BluetoothHelperModule extends ReactContextBaseJavaModule implements PermissionListener {

  private static String TAG = "BluetoothHelperModule";

  private static final String E_ACTIVITY_DOES_NOT_EXIST = "E_ACTIVITY_DOES_NOT_EXIST";
  private static final String E_BLE_CANCELLED = "E_BLE_CANCELLED";
  private static final String E_BLE_PERMISSIONS_DENIED = "E_BLE_PERMISSIONS_DENIED";
  private static final String E_SECURITY_EXCEPTION = "E_SECURITY_EXCEPTION";
  private static final String E_UNKNOWN_ERROR = "E_UNKNOWN_ERROR";
  private static final String E_ENABLE_BLE_UNKNOWN_RESPONSE = "E_ENABLE_BLE_UNKNOWN_RESPONSE";

  private Promise blePromise;

  final String[] ANDROID_12_PERMISSIONS = {
          Manifest.permission.BLUETOOTH_SCAN,
          Manifest.permission.BLUETOOTH_CONNECT
  };

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("E_ACTIVITY_DOES_NOT_EXIST", E_ACTIVITY_DOES_NOT_EXIST);
    constants.put("E_BLE_CANCELLED", E_BLE_CANCELLED);
    constants.put("E_BLE_PERMISSIONS_DENIED", E_BLE_PERMISSIONS_DENIED);
    constants.put("E_SECURITY_EXCEPTION", E_SECURITY_EXCEPTION);
    constants.put("E_UNKNOWN_ERROR", E_UNKNOWN_ERROR);
    constants.put("E_ENABLE_BLE_UNKNOWN_RESPONSE", E_ENABLE_BLE_UNKNOWN_RESPONSE);
    return constants;
  }

  private interface PermissionsResponseHandler {
    void onPermissionsGranted();
    void onPermissionsDenied(ArrayList<String> deniedPermissions);
  }

  PermissionsResponseHandler permissionsResponseHandler;

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

  @Override
  public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    if (requestCode == REQUEST_BT_PERMISSIONS) {
      if (permissionsResponseHandler == null)
        return true;

      ArrayList<String> deniedPermissions = new ArrayList<>();

      for (int i = 0; i< permissions.length; i++) {
        String permission = permissions[i];
        int result = grantResults[i];
        boolean granted = result == PackageManager.PERMISSION_GRANTED;
        if (!granted) deniedPermissions.add(permission);
      }
      if (deniedPermissions.isEmpty()) {
        permissionsResponseHandler.onPermissionsGranted();
      } else {
        permissionsResponseHandler.onPermissionsDenied(deniedPermissions);
      }
      permissionsResponseHandler = null;
    }
    return true;
  }

  public BluetoothHelperModule(ReactApplicationContext context) {
    super(context);

    // Add the listener for `onActivityResult`
    context.addActivityEventListener(bleActivityEventListener);
  }

  @Override
  public String getName() {
    return "BluetoothHelperModule";
  }

  private PermissionAwareActivity getPermissionAwareActivity() {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      throw new IllegalStateException(
              "Tried to use permissions API while not attached to an " + "Activity.");
    } else if (!(activity instanceof PermissionAwareActivity)) {
      throw new IllegalStateException(
              "Tried to use permissions API but the host Activity doesn't"
                      + " implement PermissionAwareActivity.");
    }
    return (PermissionAwareActivity) activity;
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
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        getPermissionAwareActivity().requestPermissions(ANDROID_12_PERMISSIONS, REQUEST_BT_PERMISSIONS, this);
        permissionsResponseHandler = new PermissionsResponseHandler() {
          @Override
          public void onPermissionsGranted() {
            enableBluetooth(promise);
          }

          @Override
          public void onPermissionsDenied(ArrayList<String> permissionsDenied) {
            WritableMap map = Arguments.createMap();
            WritableArray array = Arguments.createArray();
            for (String p: permissionsDenied) {
              array.pushString(p);
            }
            map.putArray("permissionsDenied", array);
            promise.reject(E_BLE_PERMISSIONS_DENIED, "Some required permissions were denied.", map);
          }
        };
      } else {
        // Activity Action: Show a system activity that allows the user to turn on Bluetooth.
        // This system activity will return once Bluetooth has completed turning on, or the user has decided not to turn Bluetooth on.
        // See: https://developer.android.com/reference/android/bluetooth/BluetoothAdapter#ACTION_REQUEST_ENABLE
        boolean isBLEAvailable = this.isBluetoothAvailable();
        if (isBLEAvailable) {
          promise.resolve(true);
        } else {
          enableBluetooth(promise);
        }
      }
    } catch(Exception e) {
      Log.e(TAG, "prompt: ", e);
      promise.reject(E_UNKNOWN_ERROR, e.getMessage(), e);
    }
  }

}