import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration,
} from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "../styles";

interface Joke {
  id: string;
  joke: string;
}

interface OwenWilsonWow {
  movie: string;
  year: number;
  release_date: string;
  director: string;
  character: string;
  movie_duration: string;
  timestamp: string;
  full_line: string;
  current_wow_in_movie: number;
  total_wows_in_movie: number;
  poster: string;
  video: {
    "1080p": string;
    "720p": string;
    "480p": string;
    "360p": string;
  };
  audio: string;
}

const SAVED_JOKES_KEY = "saved_jokes";

interface HomeScreenProps {
  onJokeSaved?: () => void;
}

export default function HomeScreen({ onJokeSaved }: HomeScreenProps) {
  const [currentJoke, setCurrentJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [savedJokes, setSavedJokes] = useState<Joke[]>([]);
  const insets = useSafeAreaInsets();

  // Animation values
  const jokeAnimation = new Animated.Value(1);
  const buttonScaleAnimation = new Animated.Value(1);
  const wowButtonAnimation = new Animated.Value(1);

  useEffect(() => {
    fetchRandomJoke();
    loadSavedJokes();
  }, []);

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

  const saveJoke = async (joke: Joke) => {
    try {
      // Check if joke is already saved
      const isAlreadySaved = savedJokes.some(
        (savedJoke) => savedJoke.id === joke.id
      );
      if (isAlreadySaved) {
        Alert.alert(
          "Already Saved!",
          "This joke is already in your collection! 😄"
        );
        return;
      }

      const newSavedJokes = [...savedJokes, joke];
      setSavedJokes(newSavedJokes);
      await AsyncStorage.setItem(
        SAVED_JOKES_KEY,
        JSON.stringify(newSavedJokes)
      );
      onJokeSaved?.(); // Notify parent to refresh saved jokes count
    } catch (error) {
      console.error("Error saving joke:", error);
    }
  };

  const fetchRandomJoke = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://icanhazdadjoke.com/", {
        headers: {
          Accept: "application/json",
          "User-Agent": "WowDad App (https://github.com/user/wowdad)",
        },
      });
      const data = await response.json();
      setCurrentJoke(data);

      // Animate joke entrance
      jokeAnimation.setValue(0);
      Animated.spring(jokeAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      Alert.alert("Error", "Failed to fetch joke. Please try again.");
      console.error("Error fetching joke:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAndPlayOwenWilsonWow = async () => {
    setAudioLoading(true);
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

        // Cleanup the sound after playing
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (error) {
      console.error("Error playing Owen Wilson wow:", error);
      // Still continue with saving the joke even if sound fails
    } finally {
      setAudioLoading(false);
    }
  };

  const animateButton = (animationValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleThumbsDown = () => {
    animateButton(buttonScaleAnimation);
    Vibration.vibrate(50);

    // Animate joke exit and fetch new one
    Animated.timing(jokeAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      fetchRandomJoke();
    });
  };

  const handleWowPress = async () => {
    if (!currentJoke) return;

    animateButton(wowButtonAnimation);
    Vibration.vibrate([50, 50, 50]);

    // Save the joke
    await saveJoke(currentJoke);

    // Play Owen Wilson wow sound
    await fetchAndPlayOwenWilsonWow();

    Alert.alert(
      "🎉 Wow!",
      'Joke saved to your collection!\nOwen Wilson says "Wow!"',
      [{ text: "Next Joke", onPress: fetchRandomJoke }]
    );
  };

  const renderJokeContent = () => {
    if (loading) {
      return (
        <View style={styles.activityBox}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={[styles.activityText, { marginTop: 10 }]}>
            Loading dad joke...
          </Text>
        </View>
      );
    }

    if (!currentJoke) {
      return (
        <View style={styles.activityBox}>
          <Text style={styles.activityText}>
            Tap the button to get a dad joke! 👆
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.activityBox,
          {
            transform: [
              { scale: jokeAnimation },
              {
                translateY: jokeAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
            opacity: jokeAnimation,
          },
        ]}
      >
        <Text style={styles.activityText}>{currentJoke.joke}</Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>🤣 WowDad Jokes 🤣</Text>
      <Text style={styles.subtitle}>
        Jokes that will make your kids say WOW!
      </Text>

      <TouchableOpacity
        style={styles.boredButton}
        onPress={fetchRandomJoke}
        disabled={loading}
      >
        <Text style={styles.boredButtonText}>
          {loading ? "Loading..." : "Get Dad Joke!"}
        </Text>
      </TouchableOpacity>

      {renderJokeContent()}

      {currentJoke && (
        <View style={styles.ratingRow}>
          <Animated.View
            style={{ transform: [{ scale: buttonScaleAnimation }] }}
          >
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: "#FF4757" }]}
              onPress={handleThumbsDown}
            >
              <MaterialIcons name="thumb-down" size={32} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: wowButtonAnimation }] }}>
            <TouchableOpacity
              style={[styles.ratingButton, { backgroundColor: "#2ED573" }]}
              onPress={handleWowPress}
              disabled={audioLoading}
            >
              {audioLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.ratingEmoji}>🤩</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <View style={styles.savedJokesInfo}>
        <Text style={styles.savedJokesText}>
          💾 Saved Jokes: {savedJokes.length}
        </Text>
      </View>
    </View>
  );
}
