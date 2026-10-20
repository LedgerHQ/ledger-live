package com.ledger.live;

import com.wix.detox.Detox;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

    // Start in touch mode like a real phone: out of it, the first focusable pressable grabs focus
    // at launch and the enclosing ScrollView jumps to it before the test's first tap.
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, true, false);

    @Test
    public void runDetoxTests() {
        Detox.runTests(mActivityRule);
    }
}
