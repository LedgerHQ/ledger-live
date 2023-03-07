package com.ledgerwallet.hid;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.UUID;

public class ReactHIDModule extends ReactContextBaseJavaModule {

    private final HashMap<String, HIDDevice> hidDevices = new HashMap<>();
    private static final String ACTION_USB_ATTACHED = "android.hardware.usb.action.USB_DEVICE_ATTACHED";
    private static final String ACTION_USB_DETACHED = "android.hardware.usb.action.USB_DEVICE_DETACHED";
    private static final String ACTION_USB_PERMISSION = "com.ledgerwallet.hid.USB_PERMISSION";

    public ReactHIDModule(ReactApplicationContext reactContext) {
        super(reactContext);
        setDeviceConnectionReceiver();
    }

    @NonNull
    @Override
    public String getName() {
        return "HID";
    }

    private void setDeviceConnectionReceiver() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_USB_ATTACHED);
        filter.addAction(ACTION_USB_DETACHED);

        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String event = intent.getAction().equals(ACTION_USB_ATTACHED) ? "onDeviceConnect"
                        : "onDeviceDisconnect";
                UsbDevice device = (UsbDevice) intent.getExtras().get(UsbManager.EXTRA_DEVICE);
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(event, buildMapFromDevice(device));
            }
        };
        getReactApplicationContext().registerReceiver(receiver, filter);
    }

    private WritableMap buildMapFromDevice(UsbDevice device) {
        WritableMap map = Arguments.createMap();
        map.putString("name", device.getDeviceName());
        map.putInt("deviceId", device.getDeviceId());
        map.putInt("productId", device.getProductId());
        map.putInt("vendorId", device.getVendorId());
        map.putString("deviceName", device.getDeviceName());
        return map;
    }

    @ReactMethod
    public void getDeviceList(Promise p) {
        UsbManager usbManager = getUsbManager();
        HashMap<String, UsbDevice> usbDevices = usbManager.getDeviceList();
        WritableArray deviceArray = Arguments.createArray();

        for (String key : usbDevices.keySet()) {
            UsbDevice device = usbDevices.get(key);
            assert device != null;
            deviceArray.pushMap(buildMapFromDevice(device));
        }
        p.resolve(deviceArray);
    }

    private static UsbDevice getDevice(int vendorId, UsbManager manager) {
        HashMap<String, UsbDevice> deviceList = manager.getDeviceList();
        for (UsbDevice device : deviceList.values()) {
            if (device.getVendorId() == vendorId) {
                return device;
            }
        }
        return null;
    }

    @ReactMethod
    public void openDevice(ReadableMap deviceObject, Promise p) {
        try {
            int vendorId = deviceObject.getInt("vendorId");
            UsbManager manager = getUsbManager();
            UsbDevice device = getDevice(vendorId, manager);
            if (manager.hasPermission(device)) {
                WritableMap usd = createHIDDevice(manager, device);
                p.resolve(usd);
            } else {
                requestUsbPermission(manager, device, p);
            }

        } catch (Exception e) {
            e.printStackTrace();
            p.reject(e);
        }
    }

    @ReactMethod
    public void exchange(String deviceId, String value, Promise p) {
        try {
            HIDDevice hid = hidDevices.get(deviceId);
            if (hid == null) {
                throw new Exception(String.format("No device opened for the id '%s'", deviceId));
            }
            hid.exchange(hexToBin(value), p);
        } catch (Exception e) {
            e.printStackTrace();
            p.reject(e);
        }
    }

    @ReactMethod
    public void closeDevice(String deviceId, Promise p) {
        try {
            HIDDevice hid = hidDevices.get(deviceId);
            if (hid == null) {
                throw new Exception(String.format("No device opened for the id '%s'", deviceId));
            }
            hid.close(p);
        } catch (Exception e) {
            e.printStackTrace();
            p.reject(e);
        }
    }

    public static byte[] hexToBin(String src) {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        int i = 0;
        while (i < src.length()) {
            char x = src.charAt(i);
            if (!((x >= '0' && x <= '9') || (x >= 'A' && x <= 'F') || (x >= 'a' && x <= 'f'))) {
                i++;
                continue;
            }
            try {
                result.write(Integer.valueOf("" + src.charAt(i) + src.charAt(i + 1), 16));
                i += 2;
            } catch (Exception e) {
                return null;
            }
        }
        return result.toByteArray();
    }

    private void requestUsbPermission(UsbManager manager, UsbDevice device, Promise p) {
        try {
            ReactApplicationContext rAppContext = getReactApplicationContext();
            PendingIntent permIntent = PendingIntent.getBroadcast(rAppContext, 0, new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            registerBroadcastReceiver(p);
            manager.requestPermission(device, permIntent);
        } catch (Exception e) {
            p.reject(e);
        }
    }

    private WritableMap createHIDDevice(UsbManager manager, UsbDevice device) throws IOException {
        HIDDevice hid = new HIDDevice(manager, device);
        hid.setDebug(true);
        String id = generateId();
        WritableMap map = Arguments.createMap();
        hidDevices.put(id, hid);
        map.putString("id", id);
        return map;
    }

    private UsbManager getUsbManager() {
        ReactApplicationContext rAppContext = getReactApplicationContext();
        return (UsbManager) rAppContext.getSystemService(Context.USB_SERVICE);
    }

    private void registerBroadcastReceiver(final Promise p) {
        IntentFilter intFilter = new IntentFilter(ACTION_USB_PERMISSION);
        final BroadcastReceiver receiver = new BroadcastReceiver() {

            @Override
            public void onReceive(Context context, Intent intent) {
                if (ACTION_USB_PERMISSION.equals(intent.getAction())) {
                    synchronized (this) {
                        UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                        if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                            UsbManager manager = getUsbManager();
                            try {
                                WritableMap hid = createHIDDevice(manager, device);
                                p.resolve(hid);
                            } catch (Exception e) {
                                p.reject(e);
                            }

                        } else {
                            p.reject(new Exception("Permission denied by user for device"));
                        }
                    }
                }
                unregisterReceiver(this);
            }
        };
        getReactApplicationContext().registerReceiver(receiver, intFilter);
    }

    private void unregisterReceiver(BroadcastReceiver receiver) {
        getReactApplicationContext().unregisterReceiver(receiver);
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }
}
