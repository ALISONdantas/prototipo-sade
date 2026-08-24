import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LightSensor } from 'expo-sensors';
import Svg, { Defs, Mask, Rect, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ImageIcon, X, SwitchCamera, Settings, AlertTriangle } from 'lucide-react-native';

import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Toast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirmExitOnBack } from '../../hooks/useConfirmExitOnBack';
import { useToast } from '../../hooks/useToast';
import { ExamStackParamList } from '../../navigation/ExamStack';
import { useExamStore } from '../../store/examStore';

type NavigationProp = NativeStackNavigationProp<ExamStackParamList>;

const { width, height } = Dimensions.get('window');

const LOW_LIGHT_THRESHOLD_LUX = 50;

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();

  const { uploadImage, isSubmitting: isUploading, currentExam } = useExamStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isLowLight, setIsLowLight] = useState(false);
  const cameraRef = React.useRef<CameraView>(null);
  const { toast, showToast } = useToast();

  // Após o upload (status PENDING_AI) o exame já foi enviado; sair não perde mais progresso,
  // e o guard precisa desarmar aqui para não bloquear o reset() feito pela AILoadingScreen.
  const { isConfirmVisible, confirmExit, cancelExit } = useConfirmExitOnBack(
    currentExam?.status !== 'PENDING_AI'
  );

  useEffect(() => {
    // LightSensor só está disponível no Android; em outras plataformas o alerta simplesmente não aparece.
    let subscription: { remove: () => void } | undefined;

    LightSensor.isAvailableAsync().then((available) => {
      if (!available) return;
      LightSensor.setUpdateInterval(1000);
      subscription = LightSensor.addListener(({ illuminance }) => {
        setIsLowLight(illuminance < LOW_LIGHT_THRESHOLD_LUX);
      });
    });

    return () => subscription?.remove();
  }, []);

  // SVG Spine path math
  const midX = width / 2;
  const topY = height * 0.15;
  const bottomY = height * 0.75;
  
  // A subtle S-curve immitating scoliosis
  // M (start), C (cubic bezier curve to end)
  // Control points: one to the right, one to the left
  const cp1X = midX + width * 0.15;
  const cp1Y = height * 0.35;
  const cp2X = midX - width * 0.15;
  const cp2Y = height * 0.55;
  
  const spinePath = `M ${midX} ${topY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${midX} ${bottomY}`;

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const processImage = async (uri: string) => {
    try {
      await uploadImage(uri);

      if (currentExam) {
        navigation.navigate('AILoading', { examId: currentExam.id, imageUri: uri });
      } else {
        navigation.navigate('MainTabs' as never);
      }
    } catch (error) {
      showToast('Não foi possível enviar a imagem. Tente novamente.', 'error');
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processImage(result.assets[0].uri);
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo) {
          processImage(photo.uri);
        }
      } catch (e) {
        console.error('Falha ao capturar imagem', e);
      }
    } else if (Platform.OS === 'web') {
      // Fallback para Web se takePicture não funcionar
      processImage('data:image/jpeg;base64,mockwebbase64string');
    }
  };

  if (!permission) {
    // Permission status is still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // We need permission
    return (
      <SafeAreaView style={styles.permissionContainer}>
        {toast && <Toast message={toast.message} variant={toast.variant} />}
        <ConfirmDialog
          visible={isConfirmVisible}
          title="Sair do exame?"
          message="Você tem um exame em andamento. Deseja realmente sair e perder o progresso?"
          onConfirm={confirmExit}
          onCancel={cancelExit}
        />
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Câmera Bloqueada</Text>
          <Text style={styles.permissionText}>
            Para capturar a imagem do teste de Adams, você precisa liberar o acesso à câmera ou escolher uma foto da galeria.
          </Text>
          <Button 
            title="Conceder Permissão" 
            onPress={requestPermission} 
            style={styles.permissionButton}
          />
          {Platform.OS !== 'web' && (
            <Button 
              title="Abrir Configurações" 
              variant="outline"
              onPress={() => Linking.openSettings()} 
            />
          )}
          <TouchableOpacity onPress={handlePickImage} style={styles.galleryFallbackBtn}>
            <ImageIcon color={colors.primary} size={20} />
            <Text style={styles.galleryFallbackText}>Escolher da Galeria</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }}>
          <Text style={{ ...typography.bodyBold, color: colors.textSecondary }}>Voltar</Text>
        </TouchableOpacity>

        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Processando imagem...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {toast && <Toast message={toast.message} variant={toast.variant} />}
      <ConfirmDialog
        visible={isConfirmVisible}
        title="Sair do exame?"
        message="Você tem um exame em andamento. Deseja realmente sair e perder o progresso?"
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* SVG Overlay Mask */}
        <View style={StyleSheet.absoluteFill}>
          <Svg height="100%" width="100%">
            <Defs>
              <Mask id="mask" x="0" y="0" height="100%" width="100%">
                {/* O fundo branco do mask é o que vai ser exibido (escuro) */}
                <Rect height="100%" width="100%" fill="white" />
                {/* O retângulo preto é o "buraco" transparente */}
                <Rect x="10%" y="10%" width="80%" height="70%" rx="24" fill="black" />
              </Mask>
            </Defs>
            
            <Rect 
              height="100%" 
              width="100%" 
              fill="rgba(0,0,0,0.6)" 
              mask="url(#mask)" 
            />

            <Path 
              d={spinePath}
              stroke="white"
              strokeWidth="4"
              strokeDasharray="8,8"
              fill="none"
              opacity="0.6"
            />
          </Svg>
        </View>

        {isLowLight && (
          <SafeAreaView style={styles.lowLightBannerWrapper}>
            <View style={styles.lowLightBanner}>
              <AlertTriangle color={colors.white} size={18} />
              <Text style={styles.lowLightBannerText}>
                Ambiente com pouca luz. Aproxime-se de uma fonte de luz.
              </Text>
            </View>
          </SafeAreaView>
        )}

        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <X color={colors.white} size={28} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Bottom Controls */}
        <SafeAreaView style={styles.bottomControls}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
            <ImageIcon color={colors.white} size={28} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButtonOuter} onPress={handleCapture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={toggleCameraFacing}>
            <SwitchCamera color={colors.white} size={28} />
          </TouchableOpacity>
        </SafeAreaView>
      </CameraView>

      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Enviando foto para análise...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: spacing.xl,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  permissionButton: {
    width: '100%',
  },
  galleryFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  galleryFallbackText: {
    ...typography.bodyBold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    ...typography.h3,
    color: colors.white,
    marginTop: spacing.lg,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 10,
  },
  lowLightBannerWrapper: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
    zIndex: 20,
  },
  lowLightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.sm,
    gap: spacing.sm,
    maxWidth: '90%',
  },
  lowLightBannerText: {
    ...typography.small,
    color: colors.white,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    zIndex: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
  },
});
