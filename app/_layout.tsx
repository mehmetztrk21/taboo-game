import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import AnimatedSplash from './components/AnimatedSplash';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Splash ekranı gösterme durumu için state
  const [showSplash, setShowSplash] = useState(true);

  // Splash animasyonu tamamlandığında çağrılacak fonksiyon
  const handleAnimationComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Yükleme hatası kontrolü
  useEffect(() => {
    if (fontError) {
      console.warn('Font yüklenirken hata oluştu:', fontError);
    }
  }, [fontError]);

  // Fontlar yüklenmediyse veya splash ekranı gösteriliyorsa
  if (!loaded) {
    return null; // Async font loading only occurs in development, so this is ok.
  }

  if (showSplash) {
    // Splash screen'i göster
    return (
      <SafeAreaProvider>
        <AnimatedSplash onAnimationComplete={handleAnimationComplete} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // Normal uygulama akışına devam et
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            headerShown: false
          }}
        >
          <Stack.Screen name="index" options={{
            title: 'Tabu',
            headerShown: false
          }} />
          <Stack.Screen name="game/index" options={{
            title: 'Oyun Ayarları',
            headerBackTitle: 'Ana Sayfa',
            headerShown: false
          }} />
          <Stack.Screen name="game/play" options={{
            headerShown: false
          }} />
          <Stack.Screen name="game/scoreboard" options={{
            headerShown: false
          }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
