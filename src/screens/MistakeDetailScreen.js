import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSQLiteContext } from 'expo-sqlite';
import { updateMistakeDetails } from '../db/database';

export default function MistakeDetailScreen({ route, navigation }) {
  const db = useSQLiteContext();
  const { mistake } = route.params;

  const [isEditing, setIsEditing] = useState(false);
  const [answer, setAnswer] = useState(mistake.answer || '');
  const [needsImage, setNeedsImage] = useState(mistake.needs_image === 1);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSaveToggle} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>{isEditing ? "儲存" : "編輯"}</Text>
        </TouchableOpacity>
      ),
    });
  }, [isEditing, answer, needsImage]);

  const handleSaveToggle = async () => {
    if (isEditing) {
      try {
        await updateMistakeDetails(db, mistake.id, mistake.subject, mistake.question, answer, mistake.solution, needsImage);
        mistake.answer = answer;
        mistake.needs_image = needsImage ? 1 : 0;
        Alert.alert("成功", "已更新儲存！");
      } catch (error) {
        Alert.alert("錯誤", "儲存失敗");
      }
    }
    setIsEditing(!isEditing);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {mistake.image_uri && (
        <Image source={{ uri: mistake.image_uri }} style={styles.image} resizeMode="contain" />
      )}
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>科目</Text>
        <Text style={styles.cardContent}>{mistake.subject}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>正確答案</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={setAnswer}
            placeholder="請輸入答案"
          />
        ) : (
          <Text style={styles.cardContent}>{answer || "(未設定答案)"}</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.cardTitle}>匯出時附上原圖</Text>
          <Switch
            value={needsImage}
            onValueChange={setNeedsImage}
            disabled={!isEditing}
          />
        </View>
        <Text style={styles.hintText}>
          {needsImage ? "✅ 匯出考卷時將會印出圖片" : "📝 純文字題，匯出時不印圖片"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>題目與解析</Text>
        <Markdown style={markdownStyles}>
          {`**題目：**\n\n${mistake.question}\n\n**解答：**\n\n${mistake.solution}`}
        </Markdown>
      </View>

      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => navigation.navigate('Chat', { mistakeId: mistake.id, mistake })}
      >
        <Text style={styles.chatButtonText}>向 AI 提問 / 更新解答</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  contentContainer: { padding: 20, alignItems: 'stretch' },
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
  chatButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    elevation: 3,
  },
  chatButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerButton: { marginRight: 15 },
  headerButtonText: { color: '#3498db', fontSize: 16, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

const markdownStyles = {
  body: { fontSize: 16, color: '#34495e', lineHeight: 24 },
  strong: { fontWeight: 'bold', color: '#2c3e50' },
};
