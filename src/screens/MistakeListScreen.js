import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { getMistakes } from '../db/database';
import { useIsFocused } from '@react-navigation/native';
import { exportToPDF, exportToWord } from '../utils/exportTools';
import { useSQLiteContext } from 'expo-sqlite';

export default function MistakeListScreen({ navigation }) {
  const db = useSQLiteContext();
  const [mistakes, setMistakes] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadMistakes();
    }
  }, [isFocused]);

  const loadMistakes = async () => {
    try {
      const data = await getMistakes(db);
      setMistakes(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportPDF = async () => {
    if (mistakes.length === 0) return Alert.alert('提示', '目前沒有錯題可以匯出。');
    try {
      await exportToPDF(mistakes);
    } catch (error) {
      Alert.alert('匯出錯誤', error.message);
    }
  };

  const handleExportWord = async () => {
    if (mistakes.length === 0) return Alert.alert('提示', '目前沒有錯題可以匯出。');
    try {
      await exportToWord(mistakes);
    } catch (error) {
      Alert.alert('匯出錯誤', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => navigation.navigate('MistakeDetail', { mistakeId: item.id, mistake: item })}
    >
      {item.image_uri && (
        <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.exportHeader}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
          <Text style={styles.exportButtonText}>匯出 PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.exportButton, styles.wordButton]} onPress={handleExportWord}>
          <Text style={[styles.exportButtonText, styles.wordButtonText]}>匯出 Word</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mistakes}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>還沒有儲存任何錯題唷！</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  exportHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#ffffff',
    justifyContent: 'space-between'
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  wordButton: {
    backgroundColor: '#2980b9',
  },
  wordButtonText: {
    color: '#fff',
  },
  listContent: { padding: 16 },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: { width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#e1e8ed' },
  textContainer: { flex: 1, justifyContent: 'center' },
  subject: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50', marginBottom: 6 },
  question: { fontSize: 14, color: '#7f8c8d', lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#95a5a6', fontSize: 16 },
});
