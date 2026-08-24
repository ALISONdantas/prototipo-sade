import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ResearchDatasetRow } from './researchDashboardService';

export type DatasetExportFormat = 'csv' | 'json';

const DATASET_COLUMNS: (keyof ResearchDatasetRow)[] = [
  'exam_id',
  'age_range',
  'region',
  'result',
  'exam_date',
];

function toCsv(rows: ResearchDatasetRow[]): string {
  const header = DATASET_COLUMNS.join(',');
  const lines = rows.map((row) => DATASET_COLUMNS.map((column) => row[column]).join(','));
  return [header, ...lines].join('\n');
}

function toJson(rows: ResearchDatasetRow[]): string {
  return JSON.stringify(rows, null, 2);
}

const MIME_TYPE: Record<DatasetExportFormat, string> = {
  csv: 'text/csv',
  json: 'application/json',
};

// expo-file-system (Paths/File/Directory) não tem suporte completo no Expo Web
// (lança "this.validatePath is not a function"). No navegador, o padrão nativo é
// disparar o download via Blob + <a download>, sem passar por expo-file-system/expo-sharing.
function downloadOnWeb(content: string, filename: string, format: DatasetExportFormat): void {
  const blob = new Blob([content], { type: MIME_TYPE[format] });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function shareOnNative(
  content: string,
  filename: string,
  format: DatasetExportFormat,
): Promise<void> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: MIME_TYPE[format], UTI: `.${format}` });
  }
}

export const exportResearchDataset = async (
  rows: ResearchDatasetRow[],
  format: DatasetExportFormat,
): Promise<void> => {
  const content = format === 'csv' ? toCsv(rows) : toJson(rows);
  const filename = `sade-dataset-pesquisa-${Date.now()}.${format}`;

  try {
    if (Platform.OS === 'web') {
      downloadOnWeb(content, filename, format);
    } else {
      await shareOnNative(content, filename, format);
    }
  } catch (error) {
    console.error('Erro ao exportar dataset de pesquisa:', error);
    throw error;
  }
};
