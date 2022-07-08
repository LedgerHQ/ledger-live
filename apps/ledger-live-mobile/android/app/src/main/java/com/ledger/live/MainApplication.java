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
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import com.ledger.live.newarchitecture.MainApplicationReactNativeHost;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

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
      new ReactNativeHostWrapper(this, new ReactNativeHost(this) {
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
      });

  private final ReactNativeHost mNewArchitectureNativeHost =
      new MainApplicationReactNativeHost(this);

  @Override
  public ReactNativeHost getReactNativeHost() {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      return mNewArchitectureNativeHost;
    } else {
      return mReactNativeHost;
    }
  }

  @Override
  public void onCreate() {
    super.onCreate();
    // If you opted-in for the New Architecture, we enable the TurboModule system
    ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    ApplicationLifecycleDispatcher.onApplicationCreate(this);
    createNotificationChannel();
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   */
  private static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.ledger.live.ReactNativeFlipper");
        aClass.getMethod("initializeFlipper", Context.class, ReactInstanceManager.class).invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}
