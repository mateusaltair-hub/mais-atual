export interface DataRow {
  [key: string]: string | number | undefined;
}

export interface ProcessedData {
  headers: string[];
  rows: DataRow[];
  identifierColumn: string | null;
  cboColumn: string | null;
  cnesColumn: string | null;
  salaryColumn: string | null;
  jornadaColumn: string | null;
  complementoColumn: string | null;
  observationColumn: string | null;
}

export interface DuplicateGroup {
  key: string;
  representativeRow: DataRow;
  totalCount: number;
  duplicatesToClean: number;
  cnes1: string;
  cnes2: string;
}

export interface AnalysisMetrics {
  totalProfessionals: number;
  uniqueRecords: number;
  duplicateKeysCount: number;
  totalExtraDuplicates: number;
  totalComplementoLoaded: number;
  recordsWithObservation: number;
  validatedRecords: number;
}

export interface GroupingItem {
  key: string;
  description: string;
  count: number;
  percentage: string;
}
