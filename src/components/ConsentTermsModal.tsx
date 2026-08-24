import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Button } from './Button';

export interface ConsentTermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TERMS_TEXT = `Termo de Consentimento Informado (protótipo)

1. Finalidade: as imagens capturadas durante o Teste de Adams são processadas por um sistema de inteligência artificial para triagem de indícios de escoliose, exclusivamente para fins de apoio à decisão clínica.

2. Dados de menores de idade: quando o teste é realizado em um dependente menor de 18 anos, o responsável legal declara estar ciente e autorizar a captura, o armazenamento e o processamento das imagens e dos dados de saúde do menor, nos termos da legislação de proteção de dados aplicável.

3. Armazenamento: as imagens e os laudos gerados ficam vinculados à conta do responsável/paciente e podem ser compartilhados com profissionais de saúde vinculados ao exame.

4. Revogação: o consentimento pode ser revogado a qualquer momento, mediante solicitação pelos canais de suporte do aplicativo.

(Texto placeholder — a versão final será fornecida pelo time jurídico.)`;

export function ConsentTermsModal({ visible, onClose, onAccept }: ConsentTermsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Termo de Consentimento Informado</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X color={colors.textSecondary} size={24} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.bodyText}>{TERMS_TEXT}</Text>
          </ScrollView>

          <Button
            title="Aceito os termos"
            onPress={onAccept}
            style={styles.acceptButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...(StyleSheet.absoluteFill as object), backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    maxHeight: '80%',
    ...shadows.card,
  },
  dragHandleContainer: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  dragHandle: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: radius.full },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2 },
  closeButton: { padding: spacing.xs },
  body: { marginBottom: spacing.lg },
  bodyText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  acceptButton: { marginTop: spacing.sm },
});
