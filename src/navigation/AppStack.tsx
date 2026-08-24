import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { Home, Users, FileText, User, Building2 } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { getLogicalRole } from '../utils/role';

import PatientDashboard from '../screens/Dashboard/PatientDashboard';
import ProfessionalDashboard from '../screens/Dashboard/ProfessionalDashboard';
import InstitutionDashboard from '../screens/Dashboard/InstitutionDashboard';
import ResearcherDashboard from '../screens/Dashboard/ResearcherDashboard';
import DependentsListScreen from '../screens/Dependents/DependentsListScreen';
import AttendedUnitsScreen from '../screens/Institutions/AttendedUnitsScreen';
import ExamHistoryScreen from '../screens/Exams/ExamHistoryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ChangePasswordScreen from '../screens/Auth/ChangePasswordScreen';
import AlertsScreen from '../screens/Alerts/AlertsScreen';
import ExamStack, { ExamStackParamList } from './ExamStack';

export type AppTabParamList = {
  HomeTab: undefined;
  DependentsTab: undefined;
  UnitsTab: undefined;
  ExamsTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  ChangePassword: undefined;
  Alerts: undefined;
  ExamFlow: NavigatorScreenParams<ExamStackParamList>;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const DashboardRouter = () => {
  const user = useAuthStore((state) => state.user);
  const logicalRole = getLogicalRole(user);

  switch (logicalRole) {
    case 'PROFESSIONAL':
      return <ProfessionalDashboard />;
    case 'INSTITUTION':
      return <InstitutionDashboard />;
    case 'RESEARCHER':
      return <ResearcherDashboard />;
    case 'PATIENT':
    default:
      return <PatientDashboard />;
  }
};

function MainTabs() {
  const user = useAuthStore((state) => state.user);
  const logicalRole = getLogicalRole(user);
  const isPatient = logicalRole === 'PATIENT';
  const isProfessional = logicalRole === 'PROFESSIONAL';
  const isResearcher = logicalRole === 'RESEARCHER';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardRouter}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      {isPatient && (
        <Tab.Screen
          name="DependentsTab"
          component={DependentsListScreen}
          options={{
            tabBarLabel: 'Dependentes',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
      )}

      {isProfessional && (
        <Tab.Screen
          name="UnitsTab"
          component={AttendedUnitsScreen}
          options={{
            tabBarLabel: 'Unidades',
            tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />,
          }}
        />
      )}

      {!isResearcher && (
        <Tab.Screen
          name="ExamsTab"
          component={ExamHistoryScreen}
          options={{
            tabBarLabel: 'Exames',
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          }}
        />
      )}

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="ExamFlow" component={ExamStack} />
    </Stack.Navigator>
  );
}
