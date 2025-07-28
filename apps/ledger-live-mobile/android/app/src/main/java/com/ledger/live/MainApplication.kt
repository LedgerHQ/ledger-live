package com.ledger.live

import android.app.Application
import android.content.Intent
import android.content.res.Configuration
import android.os.SystemClock
import android.util.Log
import com.braze.BrazeActivityLifecycleCallbackListener
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

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
                  add(BackgroundRunnerPackager())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
          }
      )

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

    private var appProcessStartTime: Long = 0
    private var didInitialColdLaunchComplete: Boolean = false
    private var coldStartupType: String? = null
    // Flag to ensure cold startup duration is sent only once.
    private var isColdStartupDurationSent = false



    override fun onCreate() {
    super.onCreate()
      appProcessStartTime = SystemClock.uptimeMillis()

      SoLoader.init(this, OpenSourceMergedSoMapping)
      registerActivityLifecycleCallbacks(StartupLifecycleListener(appProcessStartTime))

      registerActivityLifecycleCallbacks(BrazeActivityLifecycleCallbackListener())

        val launchIntent: Intent? = packageManager.getLaunchIntentForPackage(packageName)
        coldStartupType = if (launchIntent != null && launchIntent.action != null &&
            (launchIntent.action == Intent.ACTION_MAIN && launchIntent.hasCategory(Intent.CATEGORY_LAUNCHER))
        ) {
            "cold"
        } else {
            "warm"
        }

        reactNativeHost.reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
            override fun onReactContextInitialized(context: ReactContext) {
                // This is called when the React Native bridge is fully initialized and JS bundle loaded.
                if (!isColdStartupDurationSent) { // Ensure it's sent only once for a cold start
                    val coldLaunchEndTime = SystemClock.uptimeMillis()
                    val coldLaunchDuration = coldLaunchEndTime - appProcessStartTime

                    // Send the full cold/external warm duration via StartupInfoModule
                    // This is your final, accurate native cold startup time.
                    StartupInfoModule.Companion.setStartupInfo(
                        coldStartupType ?: "unknown", // Use the determined type
                        coldLaunchDuration / 1000.0, // Pass duration in seconds
                        appProcessStartTime / 1000.0, // Pass process start time in seconds (as resume start time for cold)
                        0.0 // Always 0 for timeInBackground for a cold start
                    )
                    isColdStartupDurationSent = true // Mark as sent
                }
            }
        })

      didInitialColdLaunchComplete = true

      if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)

  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }

}
