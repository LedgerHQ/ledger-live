package com.ledger.live;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;

import com.facebook.react.ReactFragmentActivity;

import org.devio.rn.splashscreen.SplashScreen;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;


public class MainActivity extends ReactFragmentActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "ledgerlivemobile";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (!BuildConfig.DEBUG) {
            SplashScreen.show(this, true);
        }
        super.onCreate(savedInstanceState);

        /**
         * Addresses an inconvenient side-effect of using `password-visible`, that allowed styled
         * texts to be pasted (receiver's address for instance) retaining the styles of the source
         * text.
         */
        final ClipboardManager clipboard = (ClipboardManager) this.getSystemService(Context.CLIPBOARD_SERVICE);
        clipboard.addPrimaryClipChangedListener( new ClipboardManager.OnPrimaryClipChangedListener() {
            boolean breakLoop = false;
            public void onPrimaryClipChanged() {
                if(breakLoop){
                    breakLoop = false;
                    return;
                }

                ClipData clipData = clipboard.getPrimaryClip();
                ClipData.Item item = clipData.getItemAt(0);
                ClipData clip = ClipData.newPlainText("overriden text", item.coerceToText(MainActivity.this).toString());
                breakLoop = true;
                clipboard.setPrimaryClip(clip);
            }
        });
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }
}
