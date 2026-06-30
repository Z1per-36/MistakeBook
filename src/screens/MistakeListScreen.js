import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { getMistakes } from '../db/database';
import { useIsFocused } from '@react-navigation/native';
import { exportToPDF, exportToWord } from '../utils/exportTools';
import { useSQLiteContext } from 'expo-sqlite';

export default function MistakeListScreen({ navigation }) {
  const db = useSQLiteContext();
  const [mistakes, setMistakes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
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

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === mistakes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mistakes.map(m => m.id)));
    }
  };

  const handleExportPDF = async () => {
    const itemsToExport = mistakes.filter(m => selectedIds.has(m.id));
    if (itemsToExport.length === 0) return Alert.alert('提示', '請先勾選要匯出的錯題。');
    try {
      await exportToPDF(itemsToExport);
    } catch (error) {
      Alert.alert('匯出錯誤', error.message);
    }
  };

  const handleExportWord = async () => {
    const itemsToExport = mistakes.filter(m => selectedIds.has(m.id));
    if (itemsToExport.length === 0) return Alert.alert('提示', '請先勾選要匯出的錯題。');
    try {
      await exportToWord(itemsToExport);
    } catch (error) {
      Alert.alert('匯出錯誤', error.message);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity 
        style={[styles.itemContainer, isSelected && styles.itemSelected]} 
        onPress={() => toggleSelect(item.id)}
        onLongPress={() => navigation.navigate('MistakeDetail', { mistakeId: item.id, mistake: item })}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        {item.image_uri && (
          <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll}>
          <Text style={styles.selectAllText}>
            {mistakes.length > 0 && selectedIds.size === mistakes.length ? '取消全選' : '全選'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>已選擇 {selectedIds.size} 題</Text>
      </View>
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
      <Text style={styles.hintText}>💡 輕點選擇，長按可查看詳情與修改解答</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
  },
  selectAllBtn: { padding: 6 },
  selectAllText: { color: '#2980b9', fontWeight: 'bold', fontSize: 16 },
  selectedCount: { color: '#7f8c8d', fontSize: 14 },
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f0f8ff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#3498db',
    backgroundColor: '#3498db',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  thumbnail: { width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#e1e8ed' },
  textContainer: { flex: 1, justifyContent: 'center' },
  question: { fontSize: 14, color: '#34495e', lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#95a5a6', fontSize: 16 },
  hintText: { textAlign: 'center', color: '#95a5a6', fontSize: 12, marginBottom: 16 },
});
