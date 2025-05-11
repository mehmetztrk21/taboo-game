import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <FontAwesome5 name="gamepad" size={32} color="#e67e22" />
          <Text style={styles.title}>TABU</Text>
        </View>
        <Text style={styles.subtitle}>Arkadaşlarınızla eğlenceli bir kelime oyunu!</Text>
      </View>

      <View style={styles.gameCard}>
        <View style={styles.gameCardContent}>
          <Text style={styles.gameCardDescription}>
            Takımınızla birlikte, tabu kelimeleri kullanmadan ana kelimeyi anlatmaya çalışın.
            Karşı takımdan önce hedef puana ulaşan kazanır!
          </Text>

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => router.push('/game')}
          >
            <Text style={styles.playButtonText}>OYNA</Text>
            <FontAwesome5 name="play" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rulesContainer}>
        <Text style={styles.sectionTitle}>Nasıl Oynanır?</Text>

        <View style={styles.ruleCard}>
          <View style={styles.ruleNumberContainer}>
            <Text style={styles.ruleNumber}>1</Text>
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>Takımları Oluştur</Text>
            <Text style={styles.ruleDescription}>
              En az iki takım oluşturun ve oyun ayarlarını belirleyin
            </Text>
          </View>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleNumberContainer}>
            <Text style={styles.ruleNumber}>2</Text>
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>Kelimeyi Anlat</Text>
            <Text style={styles.ruleDescription}>
              Tabu kelimeleri kullanmadan, kart üzerindeki ana kelimeyi takım arkadaşlarına anlat
            </Text>
          </View>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleNumberContainer}>
            <Text style={styles.ruleNumber}>3</Text>
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>Puan Kazan</Text>
            <Text style={styles.ruleDescription}>
              Her doğru tahmin için puan kazanın, hedef puana ilk ulaşan takım oyunu kazanır
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
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
