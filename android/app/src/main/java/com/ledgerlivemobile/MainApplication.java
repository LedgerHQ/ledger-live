package com.ledgerlivemobile;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.opensettings.OpenSettingsPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.horcrux.svg.SvgPackage;
import com.ledgerwallet.hid.ReactHIDPackage;
import org.reactnative.camera.RNCameraPackage;
import io.fixd.rctlocale.RCTLocalePackage;
import io.sentry.RNSentryPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.polidea.reactnativeble.BlePackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new OpenSettingsPackage(),
            new ReactNativeConfigPackage(),
            new SvgPackage(),
            new ReactHIDPackage(),
            new RNCameraPackage(),
            new RCTLocalePackage(),
            new RNSentryPackage(),
            new SplashScreenReactPackage(),
            new FingerprintAuthPackage(),
            new BlePackage()
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
