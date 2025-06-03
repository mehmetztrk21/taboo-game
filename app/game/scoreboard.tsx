import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define team type
type Team = {
  id: number;
  name: string;
  score: number;
};

// Add type definition for teamRoundScores
type TeamRoundData = {
  roundScores: number[];
  totalScore: number;
};

export default function ScoreboardScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const teams = JSON.parse(params.teams as string) as Team[];
  const currentRound = parseInt(params.currentRound as string, 10);
  const roundHistory = params.roundHistory 
    ? JSON.parse(params.roundHistory as string) 
    : new Array(teams.length).fill(0);
  const teamRoundScores = params.teamRoundScores
    ? JSON.parse(params.teamRoundScores as string) as TeamRoundData[]
    : teams.map(() => ({ roundScores: [], totalScore: 0 }));
  const hasWinner = params.hasWinner === 'true';
  const winnerTeam = params.winnerTeam ? JSON.parse(params.winnerTeam as string) as Team : null;
  const targetScore = parseInt(params.targetScore as string || '30', 10);
  
  const [showCongrats, setShowCongrats] = useState(hasWinner);
  const [applauseSound, setApplauseSound] = useState<Audio.Sound | null>(null);

  // Sort teams by score (highest first)
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  
  // Find the highest scoring team for display
  const actualWinnerTeam = winnerTeam || sortedTeams[0];

  useEffect(() => {
    // Use portrait orientation instead of landscape
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    
    // Hide status bar
    StatusBar.setHidden(true);
    
    // Attempt to find and stop any playing applause sound
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/applause.mp3'),
          { shouldPlay: false } // Don't play it again, just get a reference
        );
        setApplauseSound(sound);
      } catch (error) {
        console.log('Error loading sound:', error);
      }
    };
    
    loadSound();
    
    // Global Audio handler to stop background sounds from play.tsx
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });
    
    return () => {
      ScreenOrientation.unlockAsync();
      StatusBar.setHidden(false);
      
      // Clean up sound
      if (applauseSound) {
        applauseSound.stopAsync().catch(() => {});
        applauseSound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleNewGame = () => {
    // Stop the applause sound if it's playing
    if (applauseSound) {
      applauseSound.stopAsync().catch(() => {});
      applauseSound.unloadAsync().catch(() => {});
    }
    
    // Also disable and re-enable audio as a fallback
    Audio.setIsEnabledAsync(false).then(() => {
      Audio.setIsEnabledAsync(true);
    });
    
    router.replace('/game');
  };

  // Update the render function for the teams list to correctly calculate scores
  const renderTeamRow = (team: Team, index: number) => {
    // Find the team's index in the original teams array
    const teamIndex = teams.findIndex(t => t.id === team.id);
    
    // Get team's round data
    const teamData = teamRoundScores[teamIndex] || { roundScores: [], totalScore: 0 };
    
    // Calculate past rounds total (exclude current round)
    const pastRoundsTotal = teamData.roundScores
      .slice(0, currentRound-1)
      .reduce((sum, score) => sum + (score || 0), 0);
    
    // Current round score
    const thisTurnScore = teamData.roundScores[currentRound-1] || 0;
    
    // The total should match the team's score
    const totalScore = team.score;
    
    // Determine if this is the winning team
    const isWinner = hasWinner && team.id === actualWinnerTeam.id;
    
    return (
      <View key={team.id} style={[
        styles.teamRow,
        isWinner && styles.winnerTeamRow
      ]}>
        <Text style={styles.teamTableName}>{team.name}</Text>
        <Text style={styles.teamPastScore}>{pastRoundsTotal}</Text>
        <Text style={[
          styles.teamRoundScore,
          thisTurnScore > 0 ? styles.positiveScore : 
          thisTurnScore < 0 ? styles.negativeScore : {}
        ]}>
          {thisTurnScore > 0 ? `+${thisTurnScore}` : thisTurnScore || '0'}
        </Text>
        <Text style={styles.teamTotalScore}>{totalScore}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      {renderCongratsModal()}
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('scoreboard.title')}</Text>
        {/* <Text style={styles.roundText}>Tur {currentRound}</Text> */}
      </View>

      <View style={styles.content}>
        <View style={styles.winnerSection}>
          <Text style={styles.winnerTitle}>{t('scoreboard.highestScore')}</Text>
          <Text style={styles.winnerTeamName}>{sortedTeams[0].name}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.winnerScore}>{sortedTeams[0].score} {t('game.points')}</Text>
            {hasWinner && <Text style={styles.winnerBadge}>{t('scoreboard.winner')}</Text>}
          </View>
          {hasWinner ? (
            <View style={styles.trophyContainer}>
              <FontAwesome5 name="trophy" size={40} color="#f1c40f" />
            </View>
          ) : (
            <Text style={styles.targetText}>{t('scoreboard.target')}: {targetScore} {t('game.points')}</Text>
          )}
        </View>

        <View style={styles.teamsSection}>
          <Text style={styles.sectionTitle}>{t('scoreboard.teamScores')}</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderTeam}>{t('scoreboard.team')}</Text>
            <Text style={styles.tableHeaderRound}>{t('scoreboard.past')}</Text>
            <Text style={styles.tableHeaderRound}>{t('scoreboard.thisTurn')}</Text>
            <Text style={styles.tableHeaderTotal}>{t('scoreboard.total')}</Text>
          </View>
          
          <ScrollView contentContainerStyle={styles.teamsList}>
            {sortedTeams.map(renderTeamRow)}
          </ScrollView>
        </View>
      </View>

      <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
        <Text style={styles.newGameButtonText}>{t('scoreboard.newGame')}</Text>
        <FontAwesome5 name="redo" size={18} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
  
  // Congrats modal with fixed content to display correct winner
  function renderCongratsModal() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCongrats}
        onRequestClose={() => setShowCongrats(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FontAwesome5 name="trophy" size={50} color="#f1c40f" style={styles.modalIcon} />
            <Text style={styles.congratsTitle}>{t('scoreboard.congratulations')}</Text>
            
            {/* Show winner team with correct score */}
            <View style={styles.winnerTeamContainer}>
              <Text style={styles.congratsWinnerName}>{actualWinnerTeam.name}</Text>
              <Text style={styles.winnerTeamScore}>{actualWinnerTeam.score} {t('game.points')}</Text>
            </View>
            
            {/* <Text style={styles.targetText}>Hedef: {targetScore} puan</Text> */}
            
            {/* Show other teams in order with correct scores */}
            <View style={styles.otherTeamsContainer}>
              {sortedTeams
                .filter(team => team.id !== actualWinnerTeam.id)
                .map((team, index) => (
                  <View key={team.id} style={styles.otherTeamRow}>
                    <Text style={styles.otherTeamName}>{team.name}</Text>
                    <Text style={styles.otherTeamScore}>{team.score} {t('game.points')}</Text>
                  </View>
                ))}
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowCongrats(false)}
            >
              <Text style={styles.closeButtonText}>{t('scoreboard.showResults')}</Text>
              <FontAwesome5 name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
    padding: 20,
    paddingTop: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 5,
  },
  roundText: {
    fontSize: 18,
    color: '#bdc3c7',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  winnerSection: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerTitle: {
    fontSize: 24,
    color: '#f1c40f',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  winnerTeamName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  winnerScore: {
    fontSize: 24,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  winnerBadge: {
    backgroundColor: '#e67e22',
    color: '#fff',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 14,
    marginLeft: 10,
  },
  targetText: {
    fontSize: 16,
    color: '#bdc3c7',
    marginVertical: 10,
  },
  trophyContainer: {
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
    marginTop: 10,
  },
  teamsSection: {
    flex: 1,
    backgroundColor: '#34495e',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 5,
  },
  tableHeaderTeam: {
    color: '#bdc3c7',
    fontSize: 14,
    flex: 2,
  },
  tableHeaderRound: {
    color: '#bdc3c7',
    fontSize: 14,
    width: 70,
    textAlign: 'center',
  },
  tableHeaderTotal: {
    color: '#bdc3c7',
    fontSize: 14,
    width: 70,
    textAlign: 'right',
  },
  teamsList: {
    paddingBottom: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  winnerTeamRow: {
    backgroundColor: 'rgba(230, 126, 34, 0.2)',
  },
  teamTableName: {
    flex: 2,
    fontSize: 14,
    color: '#ecf0f1',
  },
  teamPastScore: {
    width: 70,
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  teamRoundScore: {
    width: 70,
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  positiveScore: {
    color: '#2ecc71',
  },
  negativeScore: {
    color: '#e74c3c',
  },
  teamTotalScore: {
    width: 70,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'right',
  },
  newGameButton: {
    backgroundColor: '#e67e22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  newGameButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 35,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: '#f1c40f',
    gap: 15,
  },
  modalIcon: {
    marginBottom: 20,
  },
  congratsTitle: {
    color: '#f1c40f',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  winnerTeamContainer: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(241, 196, 15, 0.2)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  congratsWinnerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  winnerTeamScore: {
    color: '#2ecc71',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  otherTeamsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  otherTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  otherTeamName: {
    color: '#ecf0f1',
    fontSize: 18,
  },
  otherTeamScore: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
}); 