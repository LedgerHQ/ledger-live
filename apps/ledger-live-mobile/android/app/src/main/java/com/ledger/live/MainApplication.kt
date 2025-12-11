package com.ledger.live

import android.app.Application
import android.content.res.Configuration
import com.braze.BrazeActivityLifecycleCallbackListener
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import cl.json.ShareApplication

class MainApplication : Application(), ReactApplication, ShareApplication {

  companion object {
    const val FW_UPDATE_NOTIFICATION_PROGRESS = 1
    const val FW_UPDATE_NOTIFICATION_USER = 2
  }


  override fun getFileProviderAuthority(): String {
          return "$packageName.provider"
  }

  override val reactNativeHost: ReactNativeHost by lazy {
      ReactNativeHostWrapper(
          this,
          object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                  // Packages that cannot be autolinked yet can be added manually here, for example:
                  // add(MyReactNativePackage())
                  add(NativeModulesPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
          }
      )
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(applicationContext, reactNativeHost)
  }

    override fun onCreate() {
    super.onCreate()

    SoLoader.init(this, OpenSourceMergedSoMapping)

    registerActivityLifecycleCallbacks(BrazeActivityLifecycleCallbackListener())
    
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // Override RN feature flags after SoLoader is ready, before using RN instances.
      load()
    }

      ApplicationLifecycleDispatcher.onApplicationCreate(this)

  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }

}
