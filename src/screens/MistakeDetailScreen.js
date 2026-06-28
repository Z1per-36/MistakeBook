import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';

export default function MistakeDetailScreen({ route, navigation }) {
  const { mistake } = route.params;

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
});

const markdownStyles = {
  body: { fontSize: 16, color: '#34495e', lineHeight: 24 },
  strong: { fontWeight: 'bold', color: '#2c3e50' },
};
