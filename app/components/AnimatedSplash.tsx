import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const lottieRef = useRef<LottieView>(null);

  // Animasyon değerleri
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const skipButtonOpacity = useRef(new Animated.Value(0)).current;

  // Pre-render için görünürlük kontrolü
  const [isReady, setIsReady] = useState(false);

  // Logo dönüşü için interpolasyon
  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg']
  });

  useEffect(() => {
    // Hazır olma durumunu güncelle
    setTimeout(() => {
      setIsReady(true);

      // Logo giriş animasyonu
      Animated.sequence([
        // Logo'yu göster
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),

        // Logo'yu büyüt ve döndür
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ]),

        // Metni göster
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),

        // Skip butonunu göster (daha uzun bir timeout için)
        Animated.timing(skipButtonOpacity, {
          toValue: 1,
          duration: 400,
          delay: 1000,
          useNativeDriver: true
        })
      ]).start();
    }, 300);
  }, []);

  const onLottieFinish = useCallback(() => {
    // Animasyon bittiğinde ana ekrana geçiş için callback'i çağır
    onAnimationComplete();
  }, [onAnimationComplete]);

  if (!isReady) return null;

  return (
    <View style={styles.container}>
      {/* Lottie yükleniyor animasyonu (arka planda) */}
      <LottieView
        ref={lottieRef}
        source={require('../../assets/animations/splash_animation.json')}
        autoPlay
        loop={false}
        speed={0.8}
        style={styles.lottieContainer}
        onAnimationFinish={onLottieFinish}
      />

      {/* Logo animasyonu */}
      <Animated.View style={[
        styles.logoContainer,
        {
          opacity: logoOpacity,
          transform: [
            { scale: logoScale },
            { rotate: logoRotation }
          ]
        }
      ]}>
        <Image
          source={require('../../assets/images/taboo_logo.png')}
          style={styles.logo}
        />

        {/* Uygulama adı animasyonu */}
        <Animated.Text style={[styles.appTitle, { opacity: textOpacity }]}>
          TABOO
        </Animated.Text>
      </Animated.View>

      {/* Skip butonu */}
      <Animated.View style={[styles.skipContainer, { opacity: skipButtonOpacity }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onAnimationComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>Geç</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e67e22',
    marginTop: 20,
    letterSpacing: 3,
  },
  lottieContainer: {
    width: width,
    height: height,
    position: 'absolute',
  },
  skipContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: 'white',
    fontWeight: '600',
  }
}); 