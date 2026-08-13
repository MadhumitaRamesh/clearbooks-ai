import { Tabs } from 'expo-router';
import { theme } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: true,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarStyle: { backgroundColor: theme.colors.surface },
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTitleStyle: { color: theme.colors.text, ...(theme.typography.h3 as any) },
    }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home'
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History',
          tabBarLabel: 'History'
        }} 
      />
      <Tabs.Screen 
        name="account" 
        options={{ 
          title: 'Account',
          tabBarLabel: 'Account'
        }} 
      />
    </Tabs>
  );
}
