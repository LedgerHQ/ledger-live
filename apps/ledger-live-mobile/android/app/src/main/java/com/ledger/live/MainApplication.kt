package com.ledger.live

import android.content.Context
import okhttp3.OkHttpClient
import android.app.Application
import android.content.res.Configuration
import com.braze.BrazeActivityLifecycleCallbackListener
import com.brentvatne.react.ReactVideoPackage
import com.facebook.flipper.android.AndroidFlipperClient
import com.facebook.flipper.android.utils.FlipperUtils
import com.facebook.flipper.core.FlipperClient
import com.facebook.flipper.plugins.inspector.DescriptorMapping
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin
import com.facebook.flipper.plugins.leakcanary2.FlipperLeakEventListener
import com.facebook.flipper.plugins.leakcanary2.LeakCanary2FlipperPlugin
import com.facebook.flipper.plugins.network.FlipperOkhttpInterceptor
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin
import com.facebook.react.modules.network.NetworkingModule
import com.facebook.react.ReactInstanceManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoModulesPackage
import expo.modules.ReactNativeHostWrapper
import leakcanary.LeakCanary

class MainApplication : Application(), ReactApplication {

  companion object {
    const val FW_UPDATE_NOTIFICATION_PROGRESS = 1
    const val FW_UPDATE_NOTIFICATION_USER = 2
  }

  override val reactNativeHost: ReactNativeHost =
      ReactNativeHostWrapper(
          this,
          object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                  // Packages that cannot be autolinked yet can be added manually here, for example:
                  // add(MyReactNativePackage())
                  add(NativeModulesPackage())
                  add(ReactVideoPackage())
                  add(BackgroundRunnerPackager())
                  add(ExpoModulesPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
          }
      )

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    LeakCanary.config = LeakCanary.config.run {
        copy(eventListeners = eventListeners + FlipperLeakEventListener())
    }

    SoLoader.init(this, false)
    registerActivityLifecycleCallbacks(BrazeActivityLifecycleCallbackListener())

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }

    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    if (BuildConfig.DEBUG && FlipperUtils.shouldEnableFlipper(this)) {
      val client = AndroidFlipperClient.getInstance(this)
      val networkFlipperPlugin = NetworkFlipperPlugin()
      NetworkingModule.setCustomClientBuilder { builder ->
        builder.addNetworkInterceptor(FlipperOkhttpInterceptor(networkFlipperPlugin))
      }

      client.addPlugin(InspectorFlipperPlugin(this, DescriptorMapping.withDefaults()))
      client.addPlugin(LeakCanary2FlipperPlugin())
      client.addPlugin(networkFlipperPlugin)
      client.start()
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
