# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

-keep class com.facebook.react.turbomodule.** { *; }

# Hermes config, cf. https://reactnative.dev/docs/hermes#android
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

-keep class com.google.android.gms.common.ConnectionResult {
    int SUCCESS;
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient {
    com.google.android.gms.ads.identifier.AdvertisingIdClient$Info getAdvertisingIdInfo(android.content.Context);
}
-keep class com.google.android.gms.ads.identifier.AdvertisingIdClient$Info {
    java.lang.String getId();
    boolean isLimitAdTrackingEnabled();
}
-keep public class com.android.installreferrer.** { *; }

-keep class com.brentvatne.** { *; }
-keep class com.yqritc.** { *; }
-keep class com.google.android.exoplayer2.** { *; }

-keep class com.ledger.live.BuildConfig { *; }

# LIVE-37010: the HID transport passes a `cont::resume` callable reference inside a data
# class that gets interpolated into a log string. FunctionReference.toString() asks
# kotlin-reflect to render it, which resolves `resume` against ContinuationKt. The
# reference's JVM signature is a compile-time constant R8 never rewrites, so both the
# member and the Continuation type name must survive shrinking for the lookup to match.
-keep class kotlin.coroutines.ContinuationKt { *; }
-keepnames class kotlin.coroutines.Continuation
