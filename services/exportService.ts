import * as XLSX from 'xlsx';
import { ProcessedData, AnalysisMetrics, DuplicateGroup, GroupingItem } from '../types';
import { formatCpf, getCboDescription, getCnesDescription, parseCurrency, getValorBaseCalculo } from './utils';
import { EXPORT_HEADERS, JORNADA_PADRAO_REPASSE, COLUMN_IDENTIFIERS, COLUMNS_TO_HIDE_IN_TABLE } from '../constants';

export const exportAllDataToExcel = (
    data: ProcessedData, 
    metrics: AnalysisMetrics, 
    duplicates: DuplicateGroup[], 
    cboBreakdown: GroupingItem[],
    originalCboBreakdownRaw: GroupingItem[] // We might need raw codes if we want better breakdown export
) => {
    const wb = XLSX.utils.book_new();

    // 1. SUMMARY SHEET
    const summaryData: any[][] = [
        ['Quadro Resumo de Profissionais', '', ''],
        [''],
        ['Métrica', 'Valor', 'Observação'],
        ['Total de Registros', metrics.totalProfessionals, 'Total de linhas no arquivo.'],
        ['Profissionais Cadastrados (Sem Duplicidades)', metrics.uniqueRecords, 'Número total de CPFs/IDs distintos (Profissionais Efetivos).'],
        ['Registros Duplicados', metrics.duplicateKeysCount, 'Número de CPFs/IDs que aparecem mais de uma vez.'],
        ['Registros Extras (a Remover)', metrics.totalExtraDuplicates, 'Total de linhas em excesso que precisam ser limpas.'],
        ['Valor Total do Complemento', metrics.totalComplementoLoaded, 'Soma da coluna de complemento original.'],
        ['Registros com Observação', metrics.recordsWithObservation, 'Total de linhas que possuem valor na coluna de observação.'],
        ['Registros Validados', metrics.validatedRecords, 'Total de registros subtraindo os que possuem observação.'],
        [''],
        ['Distribuição por CBO', '', ''],
        ['Nomenclatura', 'Contagem', 'Porcentagem']
    ];

    cboBreakdown.forEach(item => {
        summaryData.push([item.description, item.count, item.percentage + '%']);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Quadro Resumo");

    // 2. RAW DATA SHEET (Formatada)
    // Filter headers based on the global exclusion list used in RawDataTable
    const headersToKeep = data.headers.filter(h => 
        !COLUMNS_TO_HIDE_IN_TABLE.some(hidden => hidden.toUpperCase() === h.toUpperCase())
    );
    
    const isCpfCol = data.identifierColumn?.toUpperCase().includes('CPF');

    const rawDataExport = data.rows.map((row, index) => {
        const newRow: any = { 'Nº': index + 1 };
        
        headersToKeep.forEach(h => {
            newRow[h] = row[h];
        });

        if (isCpfCol && data.identifierColumn) {
            newRow[`${data.identifierColumn} Formatado`] = formatCpf(row[data.identifierColumn]);
        }
        if (data.cboColumn) {
            newRow[EXPORT_HEADERS.CBO_DESC] = getCboDescription(row[data.cboColumn]);
        }
        if (data.cnesColumn) {
            newRow[EXPORT_HEADERS.CNES_DESC] = getCnesDescription(row[data.cnesColumn]);
        }
        return newRow;
    });

    const wsRaw = XLSX.utils.json_to_sheet(rawDataExport);
    XLSX.utils.book_append_sheet(wb, wsRaw, "Dados Brutos");

    // 3. REPASSE SHEET (Forecast)
    if (data.cboColumn && data.identifierColumn && data.salaryColumn && data.jornadaColumn) {
        let totalCalculatedComplemento = 0;

        const repasseRows = data.rows.map(row => {
            // Use raw row for export basis, but add calc columns
            // We reconstruct the row similar to Raw Data but with calculations
            const newRow: any = {};
            // Copy basic headers
            headersToKeep.forEach(h => newRow[h] = row[h]);
            
            // Calculations
            const baseSalary = parseCurrency(row[data.salaryColumn!]);
            const jornada = parseCurrency(row[data.jornadaColumn!]);
            const cbo = row[data.cboColumn!];
            
            const valorBase = getValorBaseCalculo(cbo, jornada);
            const complemento = Math.max(0, valorBase - baseSalary);
            
            totalCalculatedComplemento += complemento;

            newRow[EXPORT_HEADERS.VALOR_BASE] = valorBase.toFixed(2);
            newRow[EXPORT_HEADERS.COMPLEMENTO] = complemento.toFixed(2);
            
            return newRow;
        });

        // Add Total Row
        const totalRow: any = {};
        totalRow[headersToKeep[0]] = 'TOTAL GERAL (Mensal):';
        totalRow[EXPORT_HEADERS.COMPLEMENTO] = totalCalculatedComplemento.toFixed(2);
        repasseRows.push(totalRow);

        const wsRepasse = XLSX.utils.json_to_sheet(repasseRows);
        XLSX.utils.book_append_sheet(wb, wsRepasse, "Previsão Repasse");
    }

    // 4. DUPLICATES SHEET
    if (duplicates.length > 0) {
        const duplicateExport = duplicates.map((group, index) => {
            const row = group.representativeRow;
            const newRow: any = { 'Nº': index + 1 };
            
            // Context columns: ID, Name, CBO
            if (data.identifierColumn) {
                newRow[data.identifierColumn] = row[data.identifierColumn];
                if (isCpfCol) newRow[`${data.identifierColumn} Formatado`] = formatCpf(row[data.identifierColumn]);
            }
            
            const nameCol = data.headers.find(h => COLUMN_IDENTIFIERS.NAME.some(id => h.toUpperCase().includes(id)));
            if (nameCol) newRow[nameCol] = row[nameCol];

            if (data.cboColumn) {
                newRow['CBO'] = row[data.cboColumn];
                newRow[EXPORT_HEADERS.CBO_DESC] = getCboDescription(row[data.cboColumn]);
            }

            newRow['CNES EMPREGADOR 1'] = group.cnes1;
            newRow['CNES EMPREGADOR 2'] = group.cnes2;
            if (group.cnes1) newRow['Nomenclatura CNES 1'] = getCnesDescription(group.cnes1);

            newRow['Contagem Total'] = group.totalCount;
            newRow['Duplicatas a Remover'] = group.duplicatesToClean;

            return newRow;
        });

        const wsDup = XLSX.utils.json_to_sheet(duplicateExport);
        XLSX.utils.book_append_sheet(wb, wsDup, "Duplicados Resumo");
    }

    XLSX.writeFile(wb, "relatorio_completo_saude.xlsx");
};

export const exportDuplicatesOnly = (duplicates: DuplicateGroup[], data: ProcessedData) => {
    if (duplicates.length === 0) return;
    const isCpfCol = data.identifierColumn?.toUpperCase().includes('CPF');

    const duplicateExport = duplicates.map((group, index) => {
        const row = group.representativeRow;
        const newRow: any = { 'Nº': index + 1 };
        
        if (data.identifierColumn) {
            newRow[data.identifierColumn] = row[data.identifierColumn];
            if (isCpfCol) newRow[`${data.identifierColumn} Formatado`] = formatCpf(row[data.identifierColumn]);
        }
        
        const nameCol = data.headers.find(h => COLUMN_IDENTIFIERS.NAME.some(id => h.toUpperCase().includes(id)));
        if (nameCol) newRow[nameCol] = row[nameCol];

        if (data.cboColumn) {
            newRow['CBO'] = row[data.cboColumn];
            newRow[EXPORT_HEADERS.CBO_DESC] = getCboDescription(row[data.cboColumn]);
        }

        newRow['CNES EMPREGADOR 1'] = group.cnes1;
        newRow['CNES EMPREGADOR 2'] = group.cnes2;
        
        newRow['Contagem Total'] = group.totalCount;
        newRow['Duplicatas a Remover'] = group.duplicatesToClean;

        return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(duplicateExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Duplicados");
    XLSX.writeFile(wb, "resumo_duplicados.xlsx");
};