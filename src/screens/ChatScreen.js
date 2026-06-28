import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { chatWithAI } from '../services/gemini';
import { updateMistakeSolution } from '../db/database';
import Markdown from 'react-native-markdown-display';

export default function ChatScreen({ route, navigation }) {
  const { mistakeId, mistake } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', role: 'model', text: '您好！關於這題錯題，您有什麼想討論或不清楚的地方嗎？' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI(mistake, newMessages, async (newSolution) => {
        await updateMistakeSolution(mistakeId, newSolution);
        mistake.solution = newSolution;
        Alert.alert('已更新', '錯題的解答已經根據討論更新！');
      });

      const aiMsg = { id: (Date.now() + 1).toString(), role: 'model', text: response };
      setMessages([...newMessages, aiMsg]);
    } catch (error) {
      Alert.alert('錯誤', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.modelBubble]}>
      {item.role === 'user' ? (
        <Text style={styles.userText}>{item.text}</Text>
      ) : (
        <Markdown style={markdownStyles}>{item.text}</Markdown>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatContent}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="輸入您的問題..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendButtonText}>{loading ? '傳送中...' : '傳送'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  chatContent: { padding: 16 },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#000',
    alignSelf: 'flex-end',
  },
  modelBubble: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  userText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3498db',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});

const markdownStyles = {
  body: { fontSize: 16, color: '#333', lineHeight: 24 },
  strong: { fontWeight: 'bold', color: '#000' },
  p: { marginVertical: 4 },
};
