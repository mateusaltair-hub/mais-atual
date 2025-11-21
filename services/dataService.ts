import * as XLSX from 'xlsx';
import { COLUMN_IDENTIFIERS } from '../constants';
import { findColumn } from './utils';
import { ProcessedData, DataRow } from '../types';

export const processFile = async (file: File): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonArray.length === 0) {
          reject(new Error("Arquivo vazio."));
          return;
        }

        let headers = jsonArray[0].map((h: any) => String(h || 'Coluna Vazia').trim());
        let rawData: DataRow[] = jsonArray.slice(1).map((row: any[]) => {
          let obj: DataRow = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? row[index] : '';
          });
          return obj;
        });

        // Fallback if headers are empty
        if (headers.length === 0 || headers.every(h => h === 'Coluna Vazia')) {
            headers = rawData.length > 0 ? Object.keys(rawData[0]).map((_, i) => `Coluna ${i + 1}`) : [];
        }

        // Identify columns
        const identifierColumn = findColumn(headers, COLUMN_IDENTIFIERS.ID);
        const cboColumn = findColumn(headers, COLUMN_IDENTIFIERS.CBO);
        const cnesColumn = findColumn(headers, COLUMN_IDENTIFIERS.CNES);
        const salaryColumn = findColumn(headers, COLUMN_IDENTIFIERS.SALARY);
        const jornadaColumn = findColumn(headers, COLUMN_IDENTIFIERS.JORNADA);
        const observationColumn = findColumn(headers, COLUMN_IDENTIFIERS.OBS);
        
        // Special logic for Complemento Input (Column 14 fallback)
        let complementoColumn = headers.find(h => {
            const upper = h.toUpperCase();
            return upper.includes('COMPLEMENTO') || (upper.includes('VALOR') && upper.includes('UNIÃO'));
        }) || null;
        
        if (!complementoColumn && headers.length > 13) {
            complementoColumn = headers[13];
        }

        resolve({
          headers,
          rows: rawData,
          identifierColumn,
          cboColumn,
          cnesColumn,
          salaryColumn,
          jornadaColumn,
          complementoColumn,
          observationColumn
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
