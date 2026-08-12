import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const shopName = await AsyncStorage.getItem('shopName');
        if (shopName) {
          setIsFirstLaunch(false);
        } else {
          setIsFirstLaunch(true);
        }
      } catch (e) {
        setIsFirstLaunch(true);
      }
    }
    checkFirstLaunch();
  }, []);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isFirstLaunch) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
