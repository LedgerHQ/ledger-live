package com.ledger.live;

import android.app.Application;

import com.bitgo.randombytes.RandomBytesPackage;
import com.facebook.react.ReactApplication;
import com.oblador.vectoricons.VectorIconsPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import ca.jaysoo.extradimensions.ExtraDimensionsPackage;
import com.segment.analytics.reactnative.core.RNAnalyticsPackage;
import com.oblador.keychain.KeychainPackage;
import com.showlocationservicesdialogbox.LocationServicesDialogBoxPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.opensettings.OpenSettingsPackage;
import com.swmansion.rnscreens.RNScreensPackage;
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
import com.apsl.versionnumber.RNVersionNumberPackage;
import com.ledger.reactnative.RCTCoreBindingPackage;

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
            new VectorIconsPackage(),
            new NetInfoPackage(),
            new LottiePackage(),
            new ExtraDimensionsPackage(),
            new RNAnalyticsPackage(),
            new KeychainPackage(),
            new LocationServicesDialogBoxPackage(),
            new RNGestureHandlerPackage(),
            new OpenSettingsPackage(),
            new RNScreensPackage(),
            new ReactNativeConfigPackage(),
            new SvgPackage(),
            new ReactHIDPackage(),
            new RNCameraPackage(),
            new RCTLocalePackage(),
            new RNSentryPackage(),
            new SplashScreenReactPackage(),
            new FingerprintAuthPackage(),
            new RCTCoreBindingPackage(),
            new RNVersionNumberPackage(),
            new BlePackage(),
            new RandomBytesPackage()
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
