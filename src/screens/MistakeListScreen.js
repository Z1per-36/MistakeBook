import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { getMistakes, deleteMistakes, markMistakesAsExported } from '../db/database';
import { useIsFocused } from '@react-navigation/native';
import { exportToPDF, exportToWord } from '../utils/exportTools';
import { useSQLiteContext } from 'expo-sqlite';

export default function MistakeListScreen({ navigation }) {
  const db = useSQLiteContext();
  const [mistakes, setMistakes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('unexported'); // 'unexported' | 'exported'
  const [subjectFilter, setSubjectFilter] = useState('All');
  
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
      // Don't reset selectedIds automatically unless we want to clear selections on reload
    } catch (error) {
      console.error(error);
    }
  };

  // Derive unique subjects from data
  const subjects = useMemo(() => {
    const subs = new Set(mistakes.map(m => m.subject).filter(Boolean));
    return ['All', ...Array.from(subs)];
  }, [mistakes]);

  // Filter mistakes based on status and subject
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(m => {
      const matchStatus = statusFilter === 'unexported' ? !m.is_exported : !!m.is_exported;
      const matchSubject = subjectFilter === 'All' ? true : m.subject === subjectFilter;
      return matchStatus && matchSubject;
    });
  }, [mistakes, statusFilter, subjectFilter]);

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
    const visibleIds = filteredMistakes.map(m => m.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id)) && visibleIds.length > 0;
    
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      visibleIds.forEach(id => newSelected.delete(id));
    } else {
      visibleIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return Alert.alert('提示', '請先勾選要刪除的錯題。');

    Alert.alert(
      '確認刪除',
      `確定要刪除這 ${idsToDelete.length} 題錯題嗎？刪除後無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '刪除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMistakes(db, idsToDelete);
              setSelectedIds(new Set());
              loadMistakes();
            } catch (error) {
              Alert.alert('錯誤', '刪除失敗');
            }
          }
        }
      ]
    );
  };

  const handleExportSuccess = async (exportedIds) => {
    try {
      await markMistakesAsExported(db, exportedIds);
      setSelectedIds(new Set());
      loadMistakes();
      Alert.alert('匯出成功', '已匯出的錯題已歸類至「已匯出」分頁！');
    } catch (e) {
      console.log('Failed to mark as exported', e);
    }
  };

  const handleExportPDF = () => {
    const itemsToExport = mistakes.filter(m => selectedIds.has(m.id));
    if (itemsToExport.length === 0) return Alert.alert('提示', '請先勾選要匯出的錯題。');
    const exportedIds = itemsToExport.map(m => m.id);
    
    Alert.alert(
      '選擇匯出格式',
      '請選擇您要匯出的考卷類型：',
      [
        { 
          text: '僅題目 (練習用)', 
          onPress: async () => {
            try { 
              await exportToPDF(itemsToExport, false); 
              await handleExportSuccess(exportedIds);
            } 
            catch (error) { Alert.alert('匯出錯誤', error.message); }
          }
        },
        { 
          text: '包含解答 (複習用)', 
          onPress: async () => {
            try { 
              await exportToPDF(itemsToExport, true); 
              await handleExportSuccess(exportedIds);
            } 
            catch (error) { Alert.alert('匯出錯誤', error.message); }
          }
        },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const handleExportWord = () => {
    const itemsToExport = mistakes.filter(m => selectedIds.has(m.id));
    if (itemsToExport.length === 0) return Alert.alert('提示', '請先勾選要匯出的錯題。');
    const exportedIds = itemsToExport.map(m => m.id);
    
    Alert.alert(
      '選擇匯出格式',
      '請選擇您要匯出的考卷類型：',
      [
        { 
          text: '僅題目 (練習用)', 
          onPress: async () => {
            try { 
              await exportToWord(itemsToExport, false); 
              await handleExportSuccess(exportedIds);
            } 
            catch (error) { Alert.alert('匯出錯誤', error.message); }
          }
        },
        { 
          text: '包含解答 (複習用)', 
          onPress: async () => {
            try { 
              await exportToWord(itemsToExport, true); 
              await handleExportSuccess(exportedIds);
            } 
            catch (error) { Alert.alert('匯出錯誤', error.message); }
          }
        },
        { text: '取消', style: 'cancel' },
      ]
    );
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
          <Text style={styles.subject}>{item.subject}</Text>
          <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const visibleIds = filteredMistakes.map(m => m.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

  return (
    <View style={styles.container}>
      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        <View style={styles.statusTabs}>
          <TouchableOpacity 
            style={[styles.statusTab, statusFilter === 'unexported' && styles.statusTabActive]}
            onPress={() => { setStatusFilter('unexported'); setSelectedIds(new Set()); }}
          >
            <Text style={[styles.statusTabText, statusFilter === 'unexported' && styles.statusTabTextActive]}>未匯出</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusTab, statusFilter === 'exported' && styles.statusTabActive]}
            onPress={() => { setStatusFilter('exported'); setSelectedIds(new Set()); }}
          >
            <Text style={[styles.statusTabText, statusFilter === 'exported' && styles.statusTabTextActive]}>已匯出</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectScroll}>
          {subjects.map(sub => (
            <TouchableOpacity 
              key={sub} 
              style={[styles.subjectChip, subjectFilter === sub && styles.subjectChipActive]}
              onPress={() => setSubjectFilter(sub)}
            >
              <Text style={[styles.subjectChipText, subjectFilter === sub && styles.subjectChipTextActive]}>
                {sub === 'All' ? '全部科目' : sub}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.headerControls}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll}>
          <Text style={styles.selectAllText}>
            {allVisibleSelected ? '取消全選' : '全選'}
          </Text>
        </TouchableOpacity>
        <View style={styles.rightControls}>
          <Text style={styles.selectedCount}>已選 {selectedIds.size} 題</Text>
          {selectedIds.size > 0 && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteSelected}>
              <Text style={styles.deleteBtnText}>🗑️ 刪除</Text>
            </TouchableOpacity>
          )}
        </View>
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
        data={filteredMistakes}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>這個分類下沒有錯題唷！</Text>}
        contentContainerStyle={styles.listContent}
      />
      <Text style={styles.hintText}>💡 輕點選擇，長按可查看詳情</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e1e8ed',
    paddingBottom: 8,
  },
  statusTabs: {
    flexDirection: 'row',
    padding: 12,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  statusTabActive: {
    borderColor: '#3498db',
  },
  statusTabText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  statusTabTextActive: {
    color: '#3498db',
  },
  subjectScroll: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  subjectChipActive: {
    backgroundColor: '#2c3e50',
  },
  subjectChipText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '600',
  },
  subjectChipTextActive: {
    color: '#ffffff',
  },
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
  rightControls: { flexDirection: 'row', alignItems: 'center' },
  selectedCount: { color: '#7f8c8d', fontSize: 14, marginRight: 12 },
  deleteBtn: { backgroundColor: '#ffeaa7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  deleteBtnText: { color: '#d63031', fontWeight: 'bold', fontSize: 14 },
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
  subject: { fontWeight: 'bold', fontSize: 16, color: '#2c3e50', marginBottom: 6 },
  question: { fontSize: 14, color: '#34495e', lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#95a5a6', fontSize: 16 },
  hintText: { textAlign: 'center', color: '#95a5a6', fontSize: 12, marginBottom: 16 },
});
