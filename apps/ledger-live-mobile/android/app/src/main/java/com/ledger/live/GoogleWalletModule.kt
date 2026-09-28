package com.ledger.live

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GoogleWalletModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "GoogleWalletModule"

    @ReactMethod
    fun openWallet(promise: Promise) {
        val launchIntent =
            reactContext.packageManager.getLaunchIntentForPackage(GOOGLE_WALLET_PACKAGE)
        if (launchIntent == null) {
            promise.reject(
                "google_wallet_unavailable",
                "Google Wallet is not installed or is disabled"
            )
            return
        }

        try {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(launchIntent)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("google_wallet_unavailable", error.message, error)
        }
    }

    companion object {
        private const val GOOGLE_WALLET_PACKAGE = "com.google.android.apps.walletnfcrel"
    }
}
