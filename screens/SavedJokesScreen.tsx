import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  Share,
  RefreshControl,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../styles";

interface Joke {
  id: string;
  joke: string;
}

interface OwenWilsonWow {
  audio: string;
}

const SAVED_JOKES_KEY = "saved_jokes";

export default function SavedJokesScreen() {
  const [savedJokes, setSavedJokes] = useState<Joke[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const loadSavedJokes = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_JOKES_KEY);
      if (saved) {
        setSavedJokes(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading saved jokes:", error);
    }
  };

  // Refresh saved jokes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedJokes();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedJokes();
    setRefreshing(false);
  };

  const deleteJoke = async (jokeId: string) => {
    Alert.alert(
      "Delete Joke",
      "Are you sure you want to remove this joke from your collection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedJokes = savedJokes.filter(
                (joke) => joke.id !== jokeId
              );
              setSavedJokes(updatedJokes);
              await AsyncStorage.setItem(
                SAVED_JOKES_KEY,
                JSON.stringify(updatedJokes)
              );
            } catch (error) {
              console.error("Error deleting joke:", error);
            }
          },
        },
      ]
    );
  };

  const shareJoke = async (joke: Joke) => {
    try {
      await Share.share({
        message: `${joke.joke}\n\n- Shared from WowDad 🤣`,
      });
    } catch (error) {
      console.error("Error sharing joke:", error);
    }
  };

  const playOwenWilsonWow = async (jokeId: string) => {
    setAudioLoading(jokeId);
    try {
      const response = await fetch(
        "https://owen-wilson-wow-api.onrender.com/wows/random"
      );
      const wowData: OwenWilsonWow[] = await response.json();

      if (wowData.length > 0) {
        const randomWow = wowData[0];
        const { sound } = await Audio.Sound.createAsync(
          { uri: randomWow.audio },
          { shouldPlay: true }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (error) {
      console.error("Error playing Owen Wilson wow:", error);
    } finally {
      setAudioLoading(null);
    }
  };

  const renderJokeItem = ({ item, index }: { item: Joke; index: number }) => (
    <Animated.View style={[styles.savedJokeItem, { opacity: 1 }]}>
      <View style={styles.jokeContent}>
        <Text style={styles.jokeNumber}>#{index + 1}</Text>
        <Text style={styles.savedJokeText}>{item.joke}</Text>
      </View>

      <View style={styles.jokeActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#3742fa" }]}
          onPress={() => shareJoke(item)}
        >
          <MaterialIcons name="share" size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#2ED573" }]}
          onPress={() => playOwenWilsonWow(item.id)}
          disabled={audioLoading === item.id}
        >
          {audioLoading === item.id ? (
            <Text style={{ fontSize: 16 }}>🔊</Text>
          ) : (
            <Text style={styles.ratingEmoji}>🤩</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FF4757" }]}
          onPress={() => deleteJoke(item.id)}
        >
          <MaterialIcons name="delete" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>📭</Text>
      <Text style={styles.emptyStateTitle}>No Saved Jokes Yet!</Text>
      <Text style={styles.emptyStateText}>
        Start collecting your favorite dad jokes by pressing the 🤩 button on
        the Home screen!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>💾 Your Saved Jokes</Text>

      {savedJokes.length > 0 && (
        <Text style={styles.savedJokesCounter}>
          {savedJokes.length} joke{savedJokes.length !== 1 ? "s" : ""} in your
          collection
        </Text>
      )}

      <FlatList
        data={savedJokes}
        renderItem={renderJokeItem}
        keyExtractor={(item) => item.id}
        style={styles.jokesList}
        contentContainerStyle={
          savedJokes.length === 0 ? styles.emptyContainer : undefined
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
