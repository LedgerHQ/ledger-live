package com.ledger.live

import android.app.Application
import android.content.res.Configuration
import com.braze.BrazeActivityLifecycleCallbackListener
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory
import cl.json.ShareApplication
import com.ledger.nativeperformance.AppStartupModule

class MainApplication : Application(), ReactApplication, ShareApplication {

  companion object {
    const val FW_UPDATE_NOTIFICATION_PROGRESS = 1
    const val FW_UPDATE_NOTIFICATION_USER = 2
  }


  // Must match the FileProvider declared in AndroidManifest.xml: its filepaths.xml is the only
  // one covering the app's internal files/ directory, where exported files are written.
  override fun getFileProviderAuthority(): String {
          return "$packageName.fileprovider"
  }

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(NativeModulesPackage())
        },
      jsMainModulePath = "index",
      useDevSupport = BuildConfig.DEBUG,
    )
  }

    override fun onCreate() {
    AppStartupModule.recordLaunch()
    super.onCreate()

    loadReactNative(this)

    registerActivityLifecycleCallbacks(BrazeActivityLifecycleCallbackListener())

      ApplicationLifecycleDispatcher.onApplicationCreate(this)

  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }

}
