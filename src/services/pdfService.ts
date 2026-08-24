import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ExamResponse } from './examService';
import { InstitutionDashboardData, DashboardPeriod } from './institutionDashboardService';

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  week: 'Semana',
  month: 'Mês',
  year: 'Ano',
};

export const generateAndSharePdfMock = async (exam: ExamResponse): Promise<void> => {
  const isPositive = exam.status === 'POSITIVE';
  const resultText = isPositive ? 'Indícios de Escoliose Detectados' : 'Nenhum Indício Detectado';
  const resultColor = isPositive ? '#E02424' : '#057A55'; // colors.positive and colors.negative

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Laudo SADE</title>
      <style>
        body { font-family: 'Helvetica', sans-serif; color: #111827; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #0E9F6E; margin-bottom: 5px; }
        .subtitle { font-size: 14px; color: #6B7280; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .info-label { color: #6B7280; }
        .info-value { font-weight: bold; }
        .result-box { background-color: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid ${resultColor}; }
        .result-title { font-size: 14px; color: #6B7280; margin-bottom: 10px; }
        .result-value { font-size: 20px; font-weight: bold; color: ${resultColor}; }
        .disclaimer { margin-top: 50px; font-size: 12px; color: #9CA3AF; text-align: justify; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">SADE</div>
        <div class="subtitle">Sistema de Análise Digital de Escoliose</div>
        <div class="subtitle">Data do Exame: ${new Date(exam.created_at).toLocaleDateString('pt-BR')}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados Clínicos (Anamnese)</div>
        <div class="info-row"><span class="info-label">Idade:</span><span class="info-value">${exam.age} anos</span></div>
        <div class="info-row"><span class="info-label">Sexo Biológico:</span><span class="info-value">${exam.sex === 'M' ? 'Masculino' : exam.sex === 'F' ? 'Feminino' : 'Outro'}</span></div>
        <div class="info-row"><span class="info-label">Histórico Familiar:</span><span class="info-value">${exam.family_history ? 'Sim' : 'Não'}</span></div>
        <div class="info-row"><span class="info-label">Sente dores:</span><span class="info-value">${exam.has_pain ? 'Sim' : 'Não'}</span></div>
        <div class="info-row"><span class="info-label">Cirurgia prévia:</span><span class="info-value">${exam.had_surgery ? 'Sim' : 'Não'}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Conclusão da Inteligência Artificial</div>
        <div class="result-box">
          <div class="result-title">STATUS DO EXAME</div>
          <div class="result-value">${resultText}</div>
        </div>
      </div>

      <div class="disclaimer">
        Este documento apresenta o resultado de uma triagem digital. Ele NÃO possui validade de diagnóstico médico oficial. Em caso de dúvidas ou persistência de dores, consulte um ortopedista ou especialista especializado.
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Erro ao gerar/compartilhar PDF: ', error);
    throw error;
  }
};

function seriesRows(labels: string[], values: number[]): string {
  return labels
    .map(
      (label, index) =>
        `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${values[index] ?? 0}</span></div>`,
    )
    .join('');
}

export const generateAndShareInstitutionDashboardReport = async (
  data: InstitutionDashboardData,
  period: DashboardPeriod,
  groupLabel: string,
): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório da Instituição - SADE</title>
      <style>
        body { font-family: 'Helvetica', sans-serif; color: #111827; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #0E9F6E; margin-bottom: 5px; }
        .subtitle { font-size: 14px; color: #6B7280; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #F3F4F6; }
        .info-label { color: #6B7280; }
        .info-value { font-weight: bold; }
        .disclaimer { margin-top: 50px; font-size: 12px; color: #9CA3AF; text-align: justify; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">SADE</div>
        <div class="subtitle">Relatório Consolidado da Instituição</div>
        <div class="subtitle">Período: ${PERIOD_LABEL[period]} · Setor: ${groupLabel}</div>
        <div class="subtitle">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
      </div>

      <div class="section">
        <div class="section-title">Volume de Exames</div>
        ${seriesRows(data.examVolume.labels, data.examVolume.values)}
      </div>

      <div class="section">
        <div class="section-title">Percentual de Positivos</div>
        ${data.positiveRate.map((slice) => `<div class="info-row"><span class="info-label">${slice.label}</span><span class="info-value">${slice.percentage}%</span></div>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">Distribuição Etária</div>
        ${seriesRows(data.ageDistribution.labels, data.ageDistribution.values)}
      </div>

      <div class="disclaimer">
        Este relatório apresenta métricas agregadas de triagens digitais realizadas pela instituição. Os dados NÃO substituem avaliação médica individual e não possuem validade de diagnóstico oficial.
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Erro ao gerar/compartilhar relatório do dashboard: ', error);
    throw error;
  }
};
