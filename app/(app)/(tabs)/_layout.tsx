import { router, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabsLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: true,
        headerShadowVisible: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet" color={color} />,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/task/new')}
              style={styles.headerBtn}
              hitSlop={12}>
              <Text style={[styles.plus, { color: tint }]}>+</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBtn: { paddingRight: 16, paddingVertical: 4 },
  plus: { fontSize: 28, fontWeight: '300', lineHeight: 30 },
});
