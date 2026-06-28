import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getColorRules, addColorRule, deleteColorRule } from '../db/database';
import { useSQLiteContext } from 'expo-sqlite';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [rules, setRules] = useState([]);
  const [subject, setSubject] = useState('');
  const [color, setColor] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await getColorRules(db);
      setRules(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async () => {
    if (!subject || !color || !action) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }
    try {
      await addColorRule(db, subject, color, action);
      setSubject('');
      setColor('');
      setAction('');
      loadRules();
    } catch (error) {
      Alert.alert('錯誤', error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteColorRule(db, id);
      loadRules();
    } catch (error) {
      Alert.alert('錯誤', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.ruleItem}>
      <View style={styles.ruleTextContainer}>
        <Text style={styles.ruleTitle}>
          {item.subject} - {item.color}
        </Text>
        <Text style={styles.ruleAction}>{item.action}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>刪除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>新增筆跡規則</Text>
      <TextInput
        style={styles.input}
        placeholder="科目 (例如：國文)"
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        style={styles.input}
        placeholder="筆跡顏色 (例如：紅筆)"
        value={color}
        onChangeText={setColor}
      />
      <TextInput
        style={styles.input}
        placeholder="處理動作 (例如：這是老師訂正的解答)"
        value={action}
        onChangeText={setAction}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.buttonText}>新增規則</Text>
      </TouchableOpacity>

      <Text style={styles.header}>目前的規則</Text>
      <FlatList
        data={rules}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>尚未設定任何規則。</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ruleItem: {
    flexDirection: 'row',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleTextContainer: { flex: 1, marginRight: 10 },
  ruleTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  ruleAction: { color: '#666' },
  deleteButton: { padding: 8 },
  deleteText: { color: 'red' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
});
