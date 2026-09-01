import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SelectTesteeScreen from '../screens/Exam/SelectTesteeScreen';
import PatientPickerScreen from '../screens/Exam/PatientPickerScreen';
import HealthHistoryScreen from '../screens/Exam/HealthHistoryScreen';
import GuardianInfoScreen from '../screens/Exam/GuardianInfoScreen';
import AdamsTutorialScreen from '../screens/Exam/AdamsTutorialScreen';
import CameraScreen from '../screens/Exam/CameraScreen';
import AILoadingScreen from '../screens/Exam/AILoadingScreen';
import ResultScreen from '../screens/Exam/ResultScreen';
import ReportScreen from '../screens/Exam/ReportScreen';

export type ExamTestee = {
  dependentId?: string;
  patientId?: string;
  dependentName?: string;
  age: number;
  sex: 'M' | 'F' | 'O';
};

export type ExamStackParamList = {
  SelectTestee: undefined;
  PatientPicker: undefined;
  HealthHistory: ExamTestee;
  // Só entra no fluxo quando o exame é feito por Profissional/Instituição
  // (patientId) — o Usuário testando um dependente não passa por essa etapa
  // (ver HealthHistoryScreen.handleNext).
  GuardianInfo: { patientName?: string };
  AdamsTutorial: undefined;
  Camera: undefined;
  AILoading: { examId: string; imageUri?: string };
  Result: { examId: string };
  Report: { examId: string };
};

const Stack = createNativeStackNavigator<ExamStackParamList>();

export default function ExamStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelectTestee" component={SelectTesteeScreen} />
      <Stack.Screen name="PatientPicker" component={PatientPickerScreen} />
      <Stack.Screen name="HealthHistory" component={HealthHistoryScreen} />
      <Stack.Screen name="GuardianInfo" component={GuardianInfoScreen} />
      <Stack.Screen name="AdamsTutorial" component={AdamsTutorialScreen} />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="AILoading" component={AILoadingScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
    </Stack.Navigator>
  );
}
