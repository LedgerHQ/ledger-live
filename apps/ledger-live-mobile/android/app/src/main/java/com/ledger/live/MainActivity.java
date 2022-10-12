package com.ledger.live;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

import org.devio.rn.splashscreen.SplashScreen;

import java.util.Locale;

import expo.modules.ReactActivityDelegateWrapper;

public class MainActivity extends ReactActivity {

    String importDataString = null;

    /**
     * Returns the name of the main component registered from JavaScript. This is
     * used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "ledgerlivemobile";
    }

    /**
     * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
     * you can specify the rendered you wish to use (Fabric or the older renderer).
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new MainActivityDelegate(this, getMainComponentName());
    }

    public static class MainActivityDelegate extends ReactActivityDelegate {
        public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
            super(activity, mainComponentName);
        }

        @Override
        protected ReactRootView createRootView() {
            ReactRootView reactRootView = new ReactRootView(getContext());
            // If you opted-in for the New Architecture, we enable the Fabric Renderer.
            reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
            return reactRootView;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        if (!BuildConfig.DEBUG) {
            SplashScreen.show(this, true);
        } else {
            // Allow data override for debug builds
            Bundle extras = getIntent().getExtras();
            if (extras != null) {
                this.importDataString = extras.getString("importDataString");
            }
        }
        super.onCreate(null);
        /**
         * Addresses an inconvenient side-effect of using `password-visible`, that
         * allowed styled texts to be pasted (receiver's address for instance) retaining
         * the styles of the source text.
         */
        final ClipboardManager clipboard = (ClipboardManager) this.getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard != null) {
            clipboard.addPrimaryClipChangedListener(new ClipboardManager.OnPrimaryClipChangedListener() {
                boolean breakLoop = false;

                public void onPrimaryClipChanged() {
                    if (breakLoop) {
                        breakLoop = false;
                        return;
                    }
                    if (clipboard.hasPrimaryClip()) {
                        ClipData clipData = clipboard.getPrimaryClip();
                        if (clipData == null) {
                            // according to our logs this can happen for some users
                            return;
                        }
                        ClipData.Item item = clipData.getItemAt(0);
                        if (item == null) {
                            return;
                        }
                        ClipData clip = ClipData.newPlainText("overridden text",
                                item.coerceToText(MainActivity.this).toString());
                        breakLoop = true;
                        clipboard.setPrimaryClip(clip);
                    }
                }
            });
        }

    }

    @Override
    protected void onPause() {
        super.onPause();
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    }

    @Override
    protected void onResume() {
        super.onResume();
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);

        /*
         * Override the detected language to english if it's a RTL language. TODO if we
         * ever support a RTL language we'd have to take it into account here.
         */
        Configuration config = getBaseContext().getResources().getConfiguration();
        if (config.getLayoutDirection() == View.LAYOUT_DIRECTION_RTL) {
            Locale locale = new Locale("en");
            Locale.setDefault(locale);
            config.setLocale(locale);
            getBaseContext().getResources().updateConfiguration(config,
                    getBaseContext().getResources().getDisplayMetrics());
        }

    }
}
