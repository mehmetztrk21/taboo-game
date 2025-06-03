import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageSelector from '../components/LanguageSelector';
import { initializeI18n } from '../i18n';

// Main content component with translations already initialized
const HomeContent = () => {
  const { t } = useTranslation();
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {/* Dil seçici */}
      <LanguageSelector />
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Image source={require('../../assets//images/taboo_logo.png')} style={{ width: 40, height: 40 }} />
            <Text style={styles.title}>{t('general.appName')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('home.title')}</Text>
        </View>

        <View style={styles.gameCard}>
          <View style={styles.gameCardContent}>
            <Text style={styles.gameCardDescription}>
              {t('home.gameDescription')}
            </Text>

            <TouchableOpacity
              style={styles.playButton}
              onPress={() => router.push('/game')}
            >
              <Text style={styles.playButtonText}>{t('home.newGame')}</Text>
              <FontAwesome5 name="play" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rulesContainer}>
          <Text style={styles.sectionTitle}>{t('home.howToPlay')}</Text>

          <View style={styles.ruleCard}>
            <View style={styles.ruleNumberContainer}>
              <Text style={styles.ruleNumber}>1</Text>
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>{t('home.rule1Title')}</Text>
              <Text style={styles.ruleDescription}>
                {t('home.rule1Description')}
              </Text>
            </View>
          </View>

          <View style={styles.ruleCard}>
            <View style={styles.ruleNumberContainer}>
              <Text style={styles.ruleNumber}>2</Text>
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>{t('home.rule2Title')}</Text>
              <Text style={styles.ruleDescription}>
                {t('home.rule2Description')}
              </Text>
            </View>
          </View>

          <View style={styles.ruleCard}>
            <View style={styles.ruleNumberContainer}>
              <Text style={styles.ruleNumber}>3</Text>
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>{t('home.rule3Title')}</Text>
              <Text style={styles.ruleDescription}>
                {t('home.rule3Description')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Main screen component that handles initialization
export default function HomeScreen() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const { t } = useTranslation();
  
  const initializeTranslations = useCallback(async () => {
    try {
      await initializeI18n();
      setIsI18nInitialized(true);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }, []);

  useEffect(() => {
    initializeTranslations();
  }, [initializeTranslations]);
  
  // Loading screen
  if (!isI18nInitialized) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>{t('general.loading')}</Text>
      </SafeAreaView>
    );
  }

  // Render main content once initialized
  return <HomeContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e67e22',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ecf0f1',
    textAlign: 'center',
    opacity: 0.9,
  },
  gameCard: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gameCardContent: {
    padding: 25,
  },
  gameCardDescription: {
    fontSize: 18,
    lineHeight: 26,
    color: '#ecf0f1',
    marginBottom: 25,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#e67e22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  rulesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  ruleCard: {
    flexDirection: 'row',
    backgroundColor: '#2d3436',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ruleNumberContainer: {
    backgroundColor: '#3498db',
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ruleContent: {
    flex: 1,
    padding: 15,
  },
  ruleTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
    color: '#e67e22',
  },
  ruleDescription: {
    fontSize: 16,
    color: '#ecf0f1',
    lineHeight: 22,
  },
});
