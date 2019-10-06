package com.lltool;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.bitgo.randombytes.RandomBytesPackage;
import com.peel.react.TcpSocketsModule;
import com.ledger.reactnative.RCTCoreBindingPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  static {
    try {
      System.loadLibrary("ledger-core");
    } catch (UnsatisfiedLinkError e) {
      System.err.println("ledger-core native library failed to load: " + e);
      System.exit(1);
    }
  }

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RandomBytesPackage(),
            new TcpSocketsModule(),
            new RCTCoreBindingPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
