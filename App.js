import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SQLiteProvider } from 'expo-sqlite';
import Home from './src/screens/Home';
import PreviewScreen from './src/screens/PreviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MistakeListScreen from './src/screens/MistakeListScreen';
import MistakeDetailScreen from './src/screens/MistakeDetailScreen';
import ChatScreen from './src/screens/ChatScreen';
import { initializeDatabase } from './src/db/database';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SQLiteProvider 
      databaseName="mistakebook.db" 
      onInit={initializeDatabase}
      fallback={
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#000000',
            headerTitleStyle: { fontWeight: '600' },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="Home" component={Home} options={{ title: '錯題計畫' }} />
          <Stack.Screen name="Preview" component={PreviewScreen} options={{ title: 'AI 解析' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '筆跡規則設定' }} />
          <Stack.Screen name="MistakeList" component={MistakeListScreen} options={{ title: '我的錯題本' }} />
          <Stack.Screen name="MistakeDetail" component={MistakeDetailScreen} options={{ title: '錯題詳情' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '與 AI 討論' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}
