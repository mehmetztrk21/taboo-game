import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          headerShown:false
        }}
      >
        <Stack.Screen name="index" options={{ 
          title: 'Tabu',
          headerShown:false
        }} />
        <Stack.Screen name="game/index" options={{ 
          title: 'Oyun Ayarları',
          headerBackTitle: 'Ana Sayfa',
          headerShown:false
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
  );
}
