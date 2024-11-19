package com.ledger.live

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.i18nmanager.I18nUtil
import expo.modules.ReactActivityDelegateWrapper
import java.util.Locale
import org.devio.rn.splashscreen.SplashScreen

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
        if (!BuildConfig.DEBUG) {
            SplashScreen.show(this, true)
        }
        super.onCreate(null)

        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager?
        clipboard?.addPrimaryClipChangedListener {
            var breakLoop = false
            if (clipboard.hasPrimaryClip()) {
                val clipData = clipboard.primaryClip
                if (clipData != null) {
                    val item = clipData.getItemAt(0)
                    if (item != null) {
                        val clip =
                                ClipData.newPlainText(
                                        "overridden text",
                                        item.coerceToText(this@MainActivity).toString()
                                )
                        breakLoop = true
                        clipboard.setPrimaryClip(clip)
                    }
                }
            }
        }

        val sharedI18nUtilInstance = I18nUtil.getInstance()
        sharedI18nUtilInstance.allowRTL(applicationContext, true)
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
