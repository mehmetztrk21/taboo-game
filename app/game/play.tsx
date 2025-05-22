import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Animated, BackHandler, Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import wordService from '../services/wordService';

// Oyun içinde kullanılan kart tipi
type GameCardType = {
  word: string;
  tabooWords: string[];
};

export default function GamePlayScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const teams = JSON.parse(params.teams as string);
  const timePerRound = parseInt(params.timePerRound as string, 10);
  const targetScore = parseInt(params.targetScore as string, 10);
  const passesPerRound = parseInt(params.passesPerRound as string, 10);

  // Define team type
  type Team = {
    id: number;
    name: string;
    score: number;
  };

  // Kelimeleri API'den almak için state
  const [gameCards, setGameCards] = useState<GameCardType[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerRound);
  const [passesLeft, setPassesLeft] = useState(passesPerRound);
  const [roundScores, setRoundScores] = useState({ correct: 0, incorrect: 0 });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundHistory, setRoundHistory] = useState(new Array(teams.length).fill(0));
  const [gameEnded, setGameEnded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [clockSound, setClockSound] = useState<Audio.Sound | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Create a new state to track team scores across rounds
  const [teamRoundScores, setTeamRoundScores] = useState(() => {
    // Initialize with a history for each team
    return teams.map((team: any) => {
      return {
        id: team.id,
        name: team.name,
        roundScores: [] as number[], // Array to track scores for each round
        totalScore: 0               // Running total of team's score
      };
    });
  });

  useEffect(() => {
    // Use portrait orientation
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

    // Hide status bar
    StatusBar.setHidden(true);

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isTimerRunning) {
        handlePause();
        return true;
      }
      handleExitConfirmation();
      return true;
    });

    // API'den kelimeleri al
    fetchWords();

    // Load sounds
    const loadSounds = async () => {
      try {
        const { sound: correctSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/correct.mp3')
        );
        setSound(correctSound);
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      ScreenOrientation.unlockAsync();
      StatusBar.setHidden(false);
      backHandler.remove();

      // Unload sounds
      if (sound) {
        sound.unloadAsync();
      }
      if (clockSound) {
        clockSound.unloadAsync();
      }
    };
  }, []);

  // API'den kelimeleri almak için fonksiyon
  const fetchWords = async () => {
    setIsLoadingCards(true);
    setCardsError(null);

    try {
      // wordService kullanarak rastgele 100 kelime alınıyor
      const response = await wordService.getWords({ limit: 100 });

      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Geçersiz API yanıtı');
      }

      // API'den gelen verileri oyun formatına dönüştür
      const formattedCards: GameCardType[] = response.data || [];

      if (formattedCards.length === 0) {
        throw new Error('Kelime bulunamadı');
      }

      setGameCards(formattedCards);
      shuffleCards(formattedCards);
      startTimer();
    } catch (error) {
      console.error("Kelimeler alınamadı:", error);
      setCardsError(t('general.error'));
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);

      return () => clearTimeout(timerId);
    } else if (isTimerRunning && timeLeft === 0) {
      endRound();
    }
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    // Check if game has ended and redirect to scoreboard
    if (gameEnded) {
      // Make sure scores in teams array are up to date with teamRoundScores
      teams.forEach((team: Team, index: number) => {
        team.score = teamRoundScores[index].totalScore;
      });

      // Find the winner
      const maxScore = Math.max(...teams.map((team: Team) => team.score));
      const winner = teams.find((team: Team) => team.score >= targetScore) ||
        teams.find((team: Team) => team.score === maxScore);

      router.replace({
        pathname: '/game/scoreboard',
        params: {
          teams: JSON.stringify(teams),
          currentRound: currentRound.toString(),
          roundHistory: JSON.stringify(teamRoundScores.map((t: { roundScores: number[] }) => t.roundScores[currentRound - 1] || 0)),
          teamRoundScores: JSON.stringify(teamRoundScores),
          winnerTeam: JSON.stringify(winner),
          hasWinner: "true",
          targetScore: targetScore.toString()
        }
      });
    }
  }, [gameEnded]);

  const playSound = async (soundFile: any) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.didJustFinish) {
          await newSound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const startTimer = async () => {
    setIsTimerRunning(true);

    // Start clock sound
    try {
      const { sound: newClockSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/clock.mp3'),
        { isLooping: true }
      );
      setClockSound(newClockSound);
      await newClockSound.playAsync();
    } catch (error) {
      console.log('Error playing clock sound:', error);
    }
  };

  const pauseTimer = async () => {
    setIsTimerRunning(false);

    if (clockSound) {
      await clockSound.stopAsync();
      await clockSound.unloadAsync();
      setClockSound(null);
    }
  };

  const handlePause = () => {
    pauseTimer();
    setIsPaused(true);
    setShowPauseModal(true);
  };

  const handleContinue = () => {
    setShowPauseModal(false);
    setIsPaused(false);
    startTimer();
  };

  const handleEndGame = () => {
    setShowPauseModal(false);
    router.replace('/game');
  };

  const shuffleCards = (cardsToShuffle = gameCards) => {
    const shuffled = [...cardsToShuffle].sort(() => Math.random() - 0.5);
    setGameCards(shuffled);
    setCurrentCardIndex(0);
  };

  const handleCorrect = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await playSound(require('../../assets/sounds/correct.mp3'));
    setRoundScores(prev => ({ ...prev, correct: prev.correct + 1 }));
    showNextCard();
  };

  const handleIncorrect = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await playSound(require('../../assets/sounds/wrong2.mp3'));
    setRoundScores(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    showNextCard();
  };

  const handlePass = async () => {
    if (passesLeft > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await playSound(require('../../assets/sounds/pass.mp3'));
      setPassesLeft(prev => prev - 1);
      showNextCard();
    }
  };

  const showNextCard = () => {
    // Show next card without flip animation to prevent screen flickering
    setCurrentCardIndex((prevIndex) => {
      if (prevIndex + 1 >= gameCards.length) {
        // Reshuffle if we ran out of cards
        shuffleCards();
        return 0;
      }
      return prevIndex + 1;
    });
  };

  const startRound = () => {
    // Kelimeler yüklenmediyse veya hata varsa, oyun başlatılamaz

    fetchWords();
    if (isLoadingCards) {
      return;
    }

    // Kelimeler bulunamadı
    if (gameCards.length === 0) {
      Alert.alert(
        t('game.error'),
        t('game.wordsNotFound'),
        [
          { text: t('general.cancel'), style: "cancel" },
          { text: t('general.retry'), onPress: fetchWords }
        ]
      );
      return;
    }

    setTimeLeft(timePerRound);
    setPassesLeft(passesPerRound);
    setRoundScores({ correct: 0, incorrect: 0 });
    shuffleCards();

  };

  const endRound = async () => {
    await pauseTimer();

    // Calculate round score
    const roundScore = roundScores.correct - roundScores.incorrect;

    // Update round history for the current round summary display
    const updatedRoundHistory = [...roundHistory];
    updatedRoundHistory[currentTeamIndex] = roundScore;
    setRoundHistory(updatedRoundHistory);

    // Update the persistent team round scores history
    const updatedTeamRoundScores = [...teamRoundScores];
    if (!updatedTeamRoundScores[currentTeamIndex].roundScores[currentRound - 1]) {
      updatedTeamRoundScores[currentTeamIndex].roundScores[currentRound - 1] = 0;
    }
    updatedTeamRoundScores[currentTeamIndex].roundScores[currentRound - 1] += roundScore;
    updatedTeamRoundScores[currentTeamIndex].totalScore += roundScore;
    setTeamRoundScores(updatedTeamRoundScores);

    // Calculate what the new team score will be
    const newTeamScore = updatedTeamRoundScores[currentTeamIndex].totalScore;

    // Update the team score object for display
    teams[currentTeamIndex].score = newTeamScore;

    // Game ends only if a team reaches the target score at the end of a round
    if (newTeamScore >= targetScore) {
      await playSound(require('../../assets/sounds/applause.mp3'));
      setGameEnded(true);
    }

    setShowRoundSummary(true);
  };

  const nextTeam = () => {
    // No need to update score here as it's already done in endRound

    const nextTeamIdx = (currentTeamIndex + 1) % teams.length;
    setCurrentTeamIndex(nextTeamIdx);

    // If we've gone through all teams, increment the round
    if (nextTeamIdx === 0) {
      setCurrentRound(prev => prev + 1);
    }

    setShowRoundSummary(false);

    // Reset the current team's round scores for their next turn
    setRoundScores({ correct: 0, incorrect: 0 });
  };

  const handleGoToScoreboard = () => {
    router.replace({ 
      pathname: '/game/scoreboard',
      params: {
        teams: JSON.stringify(teams),
        currentRound: currentRound.toString(),
        roundHistory: JSON.stringify(roundHistory),
        winnerTeam: JSON.stringify(teams.find((t: Team) => t.score >= targetScore) || winners[0]),
        hasWinner: (Math.max(...teams.map((team: Team) => team.score)) >= targetScore).toString(),
        targetScore: targetScore.toString()
      }
    });
  };

  // Get winning teams
  const winners = [...teams].sort((a: Team, b: Team) => b.score - a.score).filter((team: Team, _, arr) => team.score === arr[0].score);

  const handleExitConfirmation = () => {
    pauseTimer();
    Alert.alert(
      t('game.exitConfirm'),
      t('game.exitMessage'),
      [
        { text: t('general.cancel'), onPress: () => isTimerRunning && startTimer(), style: 'cancel' },
        { text: t('game.exit'), onPress: () => router.replace('/') }
      ]
    );
  };

  const renderCurrentCard = () => {
    // Kelimeler yükleniyor durumu
    if (isLoadingCards) {
      return (
        <View style={[styles.cardContainer, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#e67e22" />
          <Text style={styles.loadingText}>{t('general.loading')}</Text>
        </View>
      );
    }

    // Hata durumu
    if (cardsError) {
      return (
        <View style={[styles.cardContainer, styles.errorContainer]}>
          <FontAwesome5 name="exclamation-triangle" size={50} color="#e74c3c" />
          <Text style={styles.errorTitle}>{t('general.error')}</Text>
          <Text style={styles.errorText}>{cardsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchWords}
          >
            <Text style={styles.retryButtonText}>{t('general.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Kelime kartı yok durumu
    if (gameCards.length === 0) {
      return (
        <View style={[styles.cardContainer, styles.errorContainer]}>
          <Text style={styles.errorTitle}>{t('game.wordsNotFound')}</Text>
        </View>
      );
    }

    // Normal görüntüleme
    const card = gameCards[currentCardIndex];

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{card.word}</Text>
          <Text style={styles.scoreText}>{
            roundScores.correct - roundScores.incorrect
          }</Text>
        </View>

        <View style={styles.cardContent}>
          {card.tabooWords.map((word, index) => (
            <Text key={index} style={styles.tabooWord}>{word}</Text>
          ))}
        </View>

        <View style={styles.teamIndicator}>
          <Text style={styles.teamIndicatorName}>{teams[currentTeamIndex].name}</Text>
          <Text style={styles.passText}>{passesLeft}/{passesPerRound} {t('game.pass')}</Text>
        </View>
      </View>
    );
  };

  const renderRoundSummary = () => {
    const roundScore = roundScores.correct - roundScores.incorrect;
    const currentTeam = teams[currentTeamIndex];

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{t('game.roundResult')}</Text>
        </View>

        <View style={styles.summaryContent}>
          <View style={styles.summaryTeam}>
            <Text style={styles.summaryTeamName}>{currentTeam.name}</Text>
            <Text style={styles.summaryTeamScore}>
              {roundScore > 0
                ? `+${roundScore}`
                : roundScore}
              {' ' + t('game.points')}
            </Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <FontAwesome5 name="check" size={20} color="#2ecc71" />
              <Text style={styles.statValue}>{roundScores.correct}</Text>
              <Text style={styles.statLabel}>{t('game.correct')} (+1)</Text>
            </View>

            <View style={styles.statItem}>
              <FontAwesome5 name="times" size={20} color="#e74c3c" />
              <Text style={styles.statValue}>{roundScores.incorrect}</Text>
              <Text style={styles.statLabel}>{t('game.incorrect')} (-1)</Text>
            </View>

            <View style={styles.statItem}>
              <FontAwesome5 name="forward" size={20} color="#3498db" />
              <Text style={styles.statValue}>{passesPerRound - passesLeft}</Text>
              <Text style={styles.statLabel}>{t('game.pass')}</Text>
            </View>
          </View>

          {/* Team points table */}
          <View style={styles.teamsSection}>
            <Text style={styles.sectionTitle}>{t('game.teamScores')}</Text>

            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderTeam}>{t('game.team')}</Text>
              <Text style={styles.tableHeaderRound}>{t('game.pastRounds')}</Text>
              <Text style={styles.tableHeaderRound}>{t('game.thisRound')}</Text>
              <Text style={styles.tableHeaderTotal}>{t('game.total')}</Text>
            </View>

            <View style={styles.teamsList}>
              {teams.map((team: Team, index: number) => {
                // Get the persistent team data
                const teamData = teamRoundScores[index];

                // For the current team, we're about to add the roundScore, 
                // but haven't added it yet. For others, use their stored data.
                const isCurrentTeam = index === currentTeamIndex;

                // Calculate previous rounds total (exclude current round)
                const pastRoundsTotal = teamData.roundScores
                  .slice(0, currentRound - 1) // Get scores up to previous round
                  .reduce((sum: number, score: number) => sum + (score || 0), 0);

                // Current round score (so far) for non-current teams or 
                // the pending round score for current team
                const thisRoundScore = isCurrentTeam
                  ? roundScore
                  : (teamData.roundScores[currentRound - 1] || 0);

                // Total score is past rounds + current round
                const totalScore = pastRoundsTotal + thisRoundScore;

                return (
                  <View key={team.id} style={[
                    styles.teamRow,
                    isCurrentTeam && styles.activeTeamRow
                  ]}>
                    <Text style={styles.teamTableName}>{team.name}</Text>
                    <Text style={styles.teamPastScore}>
                      {pastRoundsTotal}
                    </Text>
                    <Text style={[
                      styles.teamRoundScore,
                      thisRoundScore > 0 ? styles.positiveScore :
                        thisRoundScore < 0 ? styles.negativeScore : {}
                    ]}>
                      {thisRoundScore > 0 ? `+${thisRoundScore}` : thisRoundScore || '0'}
                    </Text>
                    <Text style={styles.teamTotalScore}>
                      {totalScore}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            nextTeam();
          }}
        >
          <Text style={styles.nextButtonText}>
            {`${t('game.nextTeam')} ${teams[(currentTeamIndex + 1) % teams.length].name}`}
          </Text>
          <FontAwesome5 name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPauseModal = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPauseModal}
        onRequestClose={() => {
          setShowPauseModal(false);
          startTimer();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('game.paused')}</Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.continueButton]}
              onPress={handleContinue}
            >
              <Text style={styles.modalButtonText}>{t('game.resume')}</Text>
              <FontAwesome5 name="play" size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.endGameButton]}
              onPress={handleEndGame}
            >
              <Text style={styles.modalButtonText}>{t('game.endGame')}</Text>
              <FontAwesome5 name="times" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (showRoundSummary) {
    return renderRoundSummary();
  }

  return (
    <View style={styles.container}>
      {renderPauseModal()}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExitConfirmation}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>{t('game.round')}: {currentRound}</Text>
          <Text style={styles.targetScoreText}>{t('game.targetScore')}: {targetScore}</Text>
        </View>

        <View style={styles.headerButtons}>
          {isTimerRunning && (
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handlePause}
            >
              <MaterialIcons name="pause" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          <View style={styles.timerContainer}>
            <Animated.View
              style={[
                styles.timerBar,
                {
                  width: `${(timeLeft / timePerRound) * 100}%`,
                  backgroundColor: timeLeft > timePerRound * 0.6
                    ? '#2ecc71' // Yeşil (zamanın %60'ından fazla)
                    : timeLeft > timePerRound * 0.3
                      ? '#f39c12' // Sarı (zamanın %30-%60 arası)
                      : '#e74c3c' // Kırmızı (zamanın %30'undan az)
                }
              ]}
            />
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        {isLoadingCards ? (
          <View style={[styles.cardContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color="#e67e22" />
            <Text style={styles.loadingText}>{t('general.loading')}</Text>
          </View>
        ) : cardsError ? (
          <View style={[styles.cardContainer, styles.errorContainer]}>
            <FontAwesome5 name="exclamation-triangle" size={50} color="#e74c3c" />
            <Text style={styles.errorTitle}>{t('general.error')}</Text>
            <Text style={styles.errorText}>{cardsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchWords}
            >
              <Text style={styles.retryButtonText}>{t('general.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : isTimerRunning ? (
          <>
            {renderCurrentCard()}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.incorrectButton]}
                onPress={handleIncorrect}
              >
                <Text style={styles.actionButtonText}>{t('game.incorrect')}</Text>
                <Text style={styles.pointsText}>-1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.passButton,
                  passesLeft === 0 && styles.disabledButton
                ]}
                onPress={handlePass}
                disabled={passesLeft === 0}
              >
                <Text style={styles.actionButtonText}>{t('game.pass')}</Text>
                <Text style={styles.passCount}>{passesLeft}</Text>
              </TouchableOpacity>  

              <TouchableOpacity
                style={[styles.actionButton, styles.correctButton]}
                onPress={handleCorrect}
              >
                <Text style={styles.actionButtonText}>{t('game.correct')}</Text>
                <Text style={styles.pointsText}>+1</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.startRoundContainer}>
            <Text style={styles.startRoundTitle}>{t('game.nextTeam')}</Text>
            <Text style={styles.startRoundTeam}>{teams[currentTeamIndex].name}</Text>

            <TouchableOpacity
              style={styles.startRoundButton}
              onPress={startRound}
            >
              <Text style={styles.startRoundButtonText}>{t('game.startTurn')}</Text>
              <FontAwesome5 name="play" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Team Scores */}
      <View style={styles.scoresContainer}>
        {teamRoundScores.map((team: any, index: number) => (
          <View
            key={team.id}
            style={[
              styles.teamScore,
              currentTeamIndex === index && styles.activeTeam
            ]}
          >
            <Text
              style={[
                styles.teamScoreName,
                currentTeamIndex === index && styles.activeTeamText
              ]}
            >
              {team.name}
            </Text>
            <Text
              style={[
                styles.teamScoreValue,
                currentTeamIndex === index && styles.activeTeamText
              ]}
            >
              {team.totalScore || 0}
            </Text>
            <Text
              style={[
                styles.teamRoundScore,
                roundHistory[index] > 0 ? styles.positiveScore : roundHistory[index] < 0 ? styles.negativeScore : {},
                currentTeamIndex === index && styles.activeTeamText
              ]}
            >
              {roundHistory[index] > 0 ? `+${roundHistory[index]}` :
                roundHistory[index] < 0 ? roundHistory[index] : '0'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e272e',
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    height: 50,
    marginTop: 15
  },
  exitButton: {
    padding: 8,
  },
  roundInfo: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  roundText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  targetScoreText: {
    color: '#e67e22',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#34495e',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
  },
  timerContainer: {
    height: 35,
    width: 70,
    backgroundColor: '#34495e',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  timerBar: {
    position: 'absolute',
    height: '100%',
    left: 0,
  },
  timerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  gameBoard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    height: '60%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    backfaceVisibility: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  tabooWord: {
    fontSize: 22,
    marginVertical: 8,
    color: '#e74c3c',
    fontWeight: '600',
    textAlign: 'center',
  },
  teamIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamIndicatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  passText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  actionButton: {
    height: 60,
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    flex: 1,
    marginHorizontal: 5,
  },
  incorrectButton: {
    backgroundColor: '#e74c3c',
  },
  passButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
  },
  correctButton: {
    backgroundColor: '#2ecc71',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pointsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 5,
  },
  passCount: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    flexWrap: 'wrap',
  },
  teamScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 10,
    minWidth: '45%',
    justifyContent: 'space-between',
  },
  activeTeam: {
    backgroundColor: '#e67e22',
  },
  teamScoreName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  teamScoreValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginHorizontal: 10,
  },
  teamRoundScore: {
    width: 70,
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  activeTeamText: {
    color: '#fff',
  },
  positiveScore: {
    color: '#2ecc71',
  },
  negativeScore: {
    color: '#e74c3c',
  },
  startRoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRoundTitle: {
    color: '#bdc3c7',
    fontSize: 20,
    marginBottom: 10,
  },
  startRoundTeam: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  startRoundButton: {
    backgroundColor: '#e67e22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  startRoundButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: '#1e272e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  summaryHeader: {
    marginBottom: 30,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryContent: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  summaryTeam: {
    alignItems: 'center',
    marginBottom: 25,
  },
  summaryTeamName: {
    color: '#e67e22',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryTeamScore: {
    color: '#2ecc71',
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    color: '#bdc3c7',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#2ecc71',
  },
  endGameButton: {
    backgroundColor: '#e74c3c',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  teamsSection: {
    marginTop: 20,
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
    marginTop: 5,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTeamRow: {
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
  teamTotalScore: {
    width: 70,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'right',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d3436',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d3436',
  },
  errorTitle: {
    color: '#e74c3c',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#e67e22',
    padding: 15,
    borderRadius: 10,
    marginTop: 10
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 