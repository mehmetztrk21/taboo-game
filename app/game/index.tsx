import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function GameSetupScreen() {
  const { t } = useTranslation();
  
  const [teams, setTeams] = useState([
    { id: 1, name: t('setup.team') + ' 1', score: 0 },
    { id: 2, name: t('setup.team') + ' 2', score: 0 },
  ]);
  const [timePerRound, setTimePerRound] = useState('60');
  const [targetScore, setTargetScore] = useState('30');
  const [passesPerRound, setPassesPerRound] = useState('3');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Use portrait orientation instead of landscape
  React.useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };

    lockOrientation();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const addTeam = () => {
    if (newTeamName.trim() === '') return;
    
    setTeams([
      ...teams,
      { id: teams.length + 1, name: newTeamName, score: 0 }
    ]);
    setNewTeamName('');
    setShowAddTeam(false);
  };

  const removeTeam = (id: number) => {
    if (teams.length <= 2) return; // Minimum 2 teams
    setTeams(teams.filter(team => team.id !== id));
  };

  const updateTeamName = (id: number, name: string) => {
    setTeams(teams.map(team => 
      team.id === id ? { ...team, name } : team
    ));
  };

  const startGame = () => {
    router.push({
      pathname: '/game/play',
      params: {
        teams: JSON.stringify(teams),
        timePerRound: timePerRound,
        targetScore: targetScore,
        passesPerRound: passesPerRound
      }
    });
  };

  const goToHome = () => {
    router.push('/');
  };

  return (
    <>
    {/* <Stack.Screen options={{
        title: 'Oyun Ayarları',
        headerBackTitle:'Ana Sayfa'
    }}/> */}
        
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goToHome}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.title}>{t('general.appName')}</Text>
            <MaterialCommunityIcons name="cards-outline" size={32} color="#e67e22" />
          </View>
          <View style={styles.placeholderButton} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('setup.teamSetup')}</Text>
          <View style={styles.teamsList}>
            {teams.map((team) => (
              <View key={team.id} style={styles.teamRow}>
                <TextInput
                  style={styles.teamInput}
                  value={team.name}
                  onChangeText={(text) => updateTeamName(team.id, text)}
                  placeholder={t('setup.teamName')}
                />
                {teams.length > 2 && (
                  <TouchableOpacity 
                    style={styles.removeButton} 
                    onPress={() => removeTeam(team.id)}
                  >
                    <FontAwesome5 name="trash" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {showAddTeam ? (
              <View style={styles.teamRow}>
                <TextInput
                  style={styles.teamInput}
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder={t('setup.teamName')}
                  autoFocus
                />
                <TouchableOpacity style={styles.addConfirmButton} onPress={addTeam}>
                  <Text style={styles.addConfirmButtonText}>{t('general.add')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowAddTeam(false)}
                >
                  <FontAwesome5 name="times" size={18} color="#7f8c8d" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addTeamButton} 
                onPress={() => setShowAddTeam(true)}
              >
                <FontAwesome5 name="plus" size={16} color="#3498db" />
                <Text style={styles.addTeamText}>{t('setup.addTeam')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('setup.gameSettings')}</Text>
          
          <View style={styles.settingsRow}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>{t('setup.timePerRound')} ({t('setup.seconds')})</Text>
              <TextInput
                style={styles.settingInput}
                value={timePerRound}
                onChangeText={setTimePerRound}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>{t('setup.targetScore')}</Text>
              <TextInput
                style={styles.settingInput}
                value={targetScore}
                onChangeText={setTargetScore}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>{t('setup.passesPerRound')}</Text>
              <TextInput
                style={styles.settingInput}
                value={passesPerRound}
                onChangeText={setPassesPerRound}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>{t('setup.start')}</Text>
          <FontAwesome5 name="play" size={18} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
    </>
    
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 15,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  placeholderButton: {
    width: 40, // Aynı genişlikte boş alan (simetri için)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e67e22',
    marginRight: 10,
  },
  section: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  teamsList: {
    gap: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  addTeamText: {
    marginLeft: 8,
    color: '#3498db',
    fontSize: 16,
  },
  addConfirmButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  addConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 10,
    marginLeft: 10,
  },
  settingsRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  settingItem: {
    width: '100%',
    marginBottom: 15,
  },
  settingLabel: {
    color: '#bdc3c7',
    marginBottom: 8,
    fontSize: 16,
  },
  settingInput: {
    height: 45,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
}); 