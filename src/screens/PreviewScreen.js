import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { analyzeMistakeImage } from '../services/gemini';
import Markdown from 'react-native-markdown-display';
import { addMistake, getColorRules } from '../db/database';

import * as FileSystem from 'expo-file-system/legacy';
import { useSQLiteContext } from 'expo-sqlite';

export default function PreviewScreen({ route, navigation }) {
  const db = useSQLiteContext();
  const { imageUri } = route.params;
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processImage = async () => {
      try {
        const rules = await getColorRules(db);
        const base64Image = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        const response = await analyzeMistakeImage(base64Image, rules);
        setResult(response);
      } catch (e) {
        setError(e.message || '無法解析圖片');
      } finally {
        setAnalyzing(false);
      }
    };
    processImage();
  }, [imageUri]);

  const handleSave = async () => {
    if (!result) return;
    try {
      await addMistake(db, result.subject, result.question, result.solution, imageUri);
      Alert.alert('成功', '錯題已儲存到您的錯題本！');
      navigation.popToTop();
    } catch (e) {
      Alert.alert('錯誤', '儲存失敗：' + e.message);
    }
  };

  if (analyzing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>AI 正在進行雙重查證與解析中，請稍候...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>返回重試</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>科目</Text>
        <Text style={styles.cardContent}>{result?.subject}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>題目與解析</Text>
        <Markdown style={markdownStyles}>
          {`**題目：**\n\n${result?.question}\n\n**解答：**\n\n${result?.solution}`}
        </Markdown>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>儲存至錯題本</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  contentContainer: { padding: 20, alignItems: 'stretch' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa', padding: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#34495e', textAlign: 'center' },
  errorText: { color: '#e74c3c', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  button: { backgroundColor: '#3498db', padding: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  image: { width: '100%', height: 250, borderRadius: 12, marginBottom: 20, backgroundColor: '#e1e8ed' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: { fontSize: 14, color: '#7f8c8d', marginBottom: 8, fontWeight: 'bold' },
  cardContent: { fontSize: 18, color: '#2c3e50', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    elevation: 3,
  },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

const markdownStyles = {
  body: { fontSize: 16, color: '#34495e', lineHeight: 24 },
  strong: { fontWeight: 'bold', color: '#2c3e50' },
};
