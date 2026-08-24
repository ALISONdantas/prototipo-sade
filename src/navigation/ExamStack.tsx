import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AnamnesisScreen from '../screens/Exam/AnamnesisScreen';
import AdamsTutorialScreen from '../screens/Exam/AdamsTutorialScreen';
import CameraScreen from '../screens/Exam/CameraScreen';
import AILoadingScreen from '../screens/Exam/AILoadingScreen';
import ResultScreen from '../screens/Exam/ResultScreen';
import ReportScreen from '../screens/Exam/ReportScreen';

export type ExamStackParamList = {
  Anamnesis: { dependentId?: string };
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
      <Stack.Screen name="Anamnesis" component={AnamnesisScreen} />
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
