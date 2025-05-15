import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { storeLanguage } from '../i18n';
import { refreshLanguage } from '../services/api';

// Define the Language interface
interface Language {
  code: string;
  name: string;
  flag: any;
}

// PNG bayrak dosyaları
const FLAG_TR = require('../../assets/images/flags/tr.png');
const FLAG_EN = require('../../assets/images/flags/en.png');
const FLAG_AR = require('../../assets/images/flags/ar.png');

// Dil seçenekleri
const languages: Language[] = [
  { 
    code: 'tr', 
    name: 'Türkçe', 
    flag: FLAG_TR
  },
  { 
    code: 'en', 
    name: 'English', 
    flag: FLAG_EN
  },
  { 
    code: 'ar', 
    name: 'العربية', 
    flag: FLAG_AR 
  },
];

const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const currentLang = i18n.language;

  const handleLanguageChange = async (langCode: string) => {
    await storeLanguage(langCode);
    // Dil değiştikten sonra API'nin önbelleğini temizle
    refreshLanguage();
    setModalVisible(false);
  };

  // Seçili dile göre bayrağı ve kodu göster
  const getCurrentLanguage = (): Language => {
    return languages.find(lang => lang.code === currentLang) || languages[0];
  };
  
  const currentLanguage = getCurrentLanguage();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setModalVisible(true)}
      >
        <Image 
          source={currentLanguage.flag}
          style={styles.flagIcon}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>

            {languages.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLang === lang.code && styles.selectedLanguage
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Image 
                  source={lang.flag}
                  style={styles.languageFlag}
                  resizeMode="cover"
                />
                <Text style={[
                  styles.languageName,
                  currentLang === lang.code && styles.selectedLanguageText
                ]}>{t(`settings.${lang.code === 'tr' ? 'turkish' : lang.code === 'en' ? 'english' : 'arabic'}`)}</Text>
                
                {currentLang === lang.code && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('general.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  flagIcon: {
    width: 20,
    height: 14,
    borderRadius: 2,
    overflow: 'hidden',
  },
  languageCode: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d3436',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'stretch',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedLanguage: {
    backgroundColor: 'rgba(230, 126, 34, 0.2)',
  },
  languageFlag: {
    width: 24,
    height: 18,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  languageName: {
    color: '#bdc3c7',
    fontSize: 18,
    marginLeft: 15,
    flex: 1,
  },
  selectedLanguageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkIcon: {
    color: '#e67e22',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#34495e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LanguageSelector; 