import { ProcessedData, AnalysisMetrics, DuplicateGroup, GroupingItem } from '../types';
import { parseCurrency, getCboDescription, getCnesDescription } from './utils';

export const analyzeData = (data: ProcessedData): { metrics: AnalysisMetrics, duplicates: DuplicateGroup[], cboBreakdown: GroupingItem[] } => {
  const { rows, identifierColumn, complementoColumn, observationColumn, cboColumn, cnesColumn } = data;

  // Metrics initialization
  let totalProfessionals = rows.length;
  let uniqueRecords = 0;
  let duplicateKeysCount = 0;
  let totalExtraDuplicates = 0;
  let totalComplementoLoaded = 0;
  let recordsWithObservation = 0;
  
  const seenKeys = new Set<string>();
  const keysWithDuplicates = new Set<string>();
  const keyCounts: Record<string, number> = {};
  const duplicatesList: any[] = [];

  // 1. Scan for duplicates and calculate basic counts
  rows.forEach(row => {
    // Identifiers
    if (identifierColumn) {
        const val = String(row[identifierColumn] || '').trim();
        if (val) {
            keyCounts[val] = (keyCounts[val] || 0) + 1;
            if (seenKeys.has(val)) {
                keysWithDuplicates.add(val);
            } else {
                seenKeys.add(val);
            }
        }
    }

    // Complemento Sum
    if (complementoColumn) {
        totalComplementoLoaded += parseCurrency(row[complementoColumn]);
    }

    // Observations
    if (observationColumn) {
        const val = String(row[observationColumn] || '').trim();
        if (val !== '' && val !== '0' && val !== '-') {
            recordsWithObservation++;
        }
    }
  });

  uniqueRecords = seenKeys.size;
  duplicateKeysCount = keysWithDuplicates.size;
  
  // Collect duplicate rows
  if (identifierColumn) {
      rows.forEach(row => {
          const val = String(row[identifierColumn] || '').trim();
          if (keysWithDuplicates.has(val)) {
              duplicatesList.push(row);
          }
      });
      totalExtraDuplicates = duplicatesList.length - duplicateKeysCount;
  }

  // Group duplicates
  const duplicatesGroups: DuplicateGroup[] = [];
  if (identifierColumn) {
      keysWithDuplicates.forEach(key => {
          const groupRows = duplicatesList.filter(r => String(r[identifierColumn] || '').trim() === key);
          
          // Find distinct CNES
          let cnes1 = '';
          let cnes2 = '';
          if (cnesColumn) {
              const distinctCnes = Array.from(new Set(groupRows.map(r => String(r[cnesColumn] || '').trim()).filter(c => c)));
              cnes1 = distinctCnes[0] || '';
              cnes2 = distinctCnes[1] || '';
          }

          duplicatesGroups.push({
              key,
              representativeRow: groupRows[0],
              totalCount: groupRows.length,
              duplicatesToClean: groupRows.length - 1,
              cnes1,
              cnes2
          });
      });
  }
  // Sort duplicates by count desc
  duplicatesGroups.sort((a, b) => b.totalCount - a.totalCount);

  // 2. CBO Breakdown
  const cboCounts: Record<string, number> = {};
  if (cboColumn) {
      rows.forEach(row => {
          const val = String(row[cboColumn] || '').trim();
          const desc = getCboDescription(val) || 'CBO Não Mapeado';
          // Use desc as key for grouping display, or composite? Let's use desc
          const key = desc; 
          cboCounts[key] = (cboCounts[key] || 0) + 1;
      });
  }

  const cboBreakdown: GroupingItem[] = Object.entries(cboCounts).map(([key, count]) => ({
      key,
      description: key,
      count,
      percentage: ((count / totalProfessionals) * 100).toFixed(1)
  })).sort((a, b) => b.count - a.count);

  return {
      metrics: {
          totalProfessionals,
          uniqueRecords,
          duplicateKeysCount,
          totalExtraDuplicates: Math.max(0, totalExtraDuplicates),
          totalComplementoLoaded,
          recordsWithObservation,
          validatedRecords: totalProfessionals - recordsWithObservation
      },
      duplicates: duplicatesGroups,
      cboBreakdown
  };
};
