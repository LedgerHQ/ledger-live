package com.ledger.live;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;

import com.brentvatne.react.ReactVideoPackage;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import com.braze.BrazeActivityLifecycleCallbackListener;

import java.util.List;

import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import com.shopify.reactnativeperformance.ReactNativePerformance;

public class MainApplication extends Application implements ReactApplication {
  public static String LO_NOTIFICATION_CHANNEL = "lo-llm";
  public static String HI_NOTIFICATION_CHANNEL = "hi-llm";
  public static int FW_UPDATE_NOTIFICATION_PROGRESS = 1;
  public static int FW_UPDATE_NOTIFICATION_USER = 2;

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String description = "Notification channel for background running tasks";
      NotificationChannel loChannel = new NotificationChannel(LO_NOTIFICATION_CHANNEL, LO_NOTIFICATION_CHANNEL, NotificationManager.IMPORTANCE_DEFAULT);
      loChannel.setDescription(description);
      NotificationChannel hiChannel = new NotificationChannel(HI_NOTIFICATION_CHANNEL, HI_NOTIFICATION_CHANNEL, NotificationManager.IMPORTANCE_HIGH);
      hiChannel.setDescription(description);

      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(loChannel);
      notificationManager.createNotificationChannel(hiChannel);
    }
  }

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          packages.add(new NativeModulesPackage());
          packages.add(new ReactVideoPackage());
          packages.add(new BackgroundRunnerPackager());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }
        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    ReactNativePerformance.onAppStarted();
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
    createNotificationChannel();
    registerActivityLifecycleCallbacks(new BrazeActivityLifecycleCallbackListener());
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}
