import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide the tab bar completely on all screens
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          href: '/game',
          title: 'Tabu Oyunu',
          tabBarIcon: ({ color }) => <FontAwesome5 name="gamepad" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
