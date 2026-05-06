package com.ledger.live

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import androidx.activity.OnBackPressedCallback
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.i18nmanager.I18nUtil
import expo.modules.ReactActivityDelegateWrapper
import java.util.Locale
import org.devio.rn.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "ledgerlivemobile"

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate =
            ReactActivityDelegateWrapper(
                    this,
                    BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
                    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
            )

    override fun onCreate(savedInstanceState: Bundle?) {
        // Registered BEFORE super.onCreate() so this callback has the lowest LIFO priority.
        // react-native-screens registers its own OnBackPressedCallbacks after super.onCreate()
        // (during RN init / screen rendering), giving them higher priority. They handle back
        // natively for mid-flow screens. Our callback only fires when react-native-screens has
        // already given up (root screen with nothing to pop), bridging the RN 0.81 + targetSdk
        // 36 gap where Android 16 no longer calls Activity.onBackPressed() directly.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                this@MainActivity.onBackPressed()
            }
        })

        if (android.os.Build.VERSION.SDK_INT >= 31) {
            installSplashScreen()
        }
        if (!BuildConfig.DEBUG) {
            SplashScreen.show(this, true)
        }
        super.onCreate(null)

        val sharedI18nUtilInstance = I18nUtil.getInstance()
        sharedI18nUtilInstance.allowRTL(applicationContext, true)
    }

    // When JS doesn't consume the back press, ReactActivity calls this. Without the
    // override it re-enters onBackPressedDispatcher and loops. Move to background instead.
    override fun invokeDefaultOnBackPressed() {
        moveTaskToBack(false)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (!hasFocus && !BuildConfig.DEBUG) {
            window.setFlags(
                    WindowManager.LayoutParams.FLAG_SECURE,
                    WindowManager.LayoutParams.FLAG_SECURE
            )
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    override fun onResume() {
        super.onResume()
        /*
         * Override the detected language to english if it's a RTL language. TODO if we
         * ever support a RTL language we'd have to take it into account here.
         */
        val config = baseContext.resources.configuration
        if (config.layoutDirection == View.LAYOUT_DIRECTION_RTL) {
            val locale = Locale("en")
            Locale.setDefault(locale)
            config.setLocale(locale)
            baseContext.resources.updateConfiguration(config, baseContext.resources.displayMetrics)
        }
    }
}
