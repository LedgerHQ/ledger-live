package com.ledger.live;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.util.List;

public class ImagePickerModule extends ReactContextBaseJavaModule implements ActivityEventListener{
    private static String REACT_CLASS = "ImagePickerModule";
    private static String E_NULL_RESULT = "E_NULL_RESULT";

    private Promise pickerPromise;

    public ImagePickerModule(ReactApplicationContext context) {
        super(context);
        context.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        try {
            if (requestCode == Constants.REQUEST_IMAGE) {
                if (resultCode == Activity.RESULT_CANCELED){
                    WritableMap map = Arguments.createMap();
                    map.putBoolean("cancelled", true);
                    pickerPromise.resolve(map);
                } else if (data == null) {
                    pickerPromise.reject(E_NULL_RESULT);
                } else if (resultCode == Activity.RESULT_OK) {
                    if (pickerPromise == null) throw new Error(E_NULL_RESULT);
                    WritableMap map = Arguments.createMap();
                    map.putString("uri", data.getData().toString());
                    pickerPromise.resolve(map);
                } else {
                    pickerPromise.reject(String.valueOf(resultCode));
                }
                pickerPromise = null;
            }
        } catch (Exception e) {
            if (pickerPromise != null) pickerPromise.reject(e);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {}

    private String getDefaultPictureAppPackageName() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        List<ResolveInfo> pkgAppsList = getReactApplicationContext().getPackageManager().queryIntentActivities(intent, PackageManager.GET_RESOLVED_FILTER);
        try {
            return pkgAppsList.get(0).activityInfo.processName;
        } catch (Exception e) {
            return null;
        }
    }

    @ReactMethod
    public void pickImage(Promise promise) {
        pickerPromise = promise;
        try {
            String defaultPictureApp = getDefaultPictureAppPackageName();
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("image/*");
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            if (defaultPictureApp != null) intent.setPackage(defaultPictureApp);
            getCurrentActivity().startActivityForResult(intent, Constants.REQUEST_IMAGE);
        } catch(Exception e) {
            promise.reject(e);
        }
    }
}
