package com.rivex.rivexwallet;

import com.facebook.react.ReactActivity;
import android.content.Intent; // <--- import
import android.os.Bundle;
import android.content.res.Configuration; // <--- import
// import com.reactnativecomponent.splashscreen.RCTSplashScreen;
import org.devio.rn.splashscreen.SplashScreen; // here
public class MainActivity extends ReactActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // SplashScreen.show(this);  // here
        SplashScreen.show(this, R.style.SplashScreenTheme);
        super.onCreate(savedInstanceState);
    }

    // @Override
    // protected void onCreate(Bundle savedInstanceState) {
    //     RCTSplashScreen.openSplashScreen(this);   //open splashscreen
    //     //RCTSplashScreen.openSplashScreen(this, true, ImageView.ScaleType.FIT_XY);   //open splashscreen fullscreen
    //     super.onCreate(savedInstanceState);
    // }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "RiveX";
    }

    @Override
      public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }
}
