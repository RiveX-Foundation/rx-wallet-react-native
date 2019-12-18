package com.rivex.rivexwallet;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.masteratul.exceptionhandler.ReactNativeExceptionHandlerPackage;
import com.dylanvann.fastimage.FastImageViewPackage;
import com.reactnativecommunity.viewpager.RNCViewPagerPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.reactnativecommunity.netinfo.NetInfoPackage;
import com.bitgo.randombytes.RandomBytesPackage;
import com.remobile.qrcodeLocalImage.RCTQRCodeLocalImagePackage;
import com.imagepicker.ImagePickerPackage;
import org.wonday.orientation.OrientationPackage;
// import com.airbnb.android.react.lottie.LottiePackage;
import me.pushy.sdk.react.PushyPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import org.reactnative.camera.RNCameraPackage;
import com.diegofhg.obscure.ObscurePackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.horcrux.svg.SvgPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNCWebViewPackage(),
            new ReactNativeExceptionHandlerPackage(),
            new FastImageViewPackage(),
            new RNCViewPagerPackage(),
            new SplashScreenReactPackage(),
            new NetInfoPackage(),
            new RandomBytesPackage(),
            new RCTQRCodeLocalImagePackage(),
            new ImagePickerPackage(),
            new OrientationPackage(),
            // new LottiePackage(),
            new AsyncStoragePackage(),
            new RNCameraPackage(),
            new ObscurePackage(),
            new FingerprintAuthPackage(),
            new LinearGradientPackage(),
            new SvgPackage(),
            new VectorIconsPackage(),
            new RNGestureHandlerPackage(),
            new PushyPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
