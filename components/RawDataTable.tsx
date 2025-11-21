import React, { useState, useMemo } from 'react';
import { DataRow } from '../types';
import { Download, Filter, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { getCboDescription } from '../services/utils';
import { COLUMNS_TO_HIDE_IN_TABLE } from '../constants';

interface RawDataTableProps {
  headers: string[];
  rows: DataRow[];
  cboColumn: string | null;
  onExportAll: () => void;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const RawDataTable: React.FC<RawDataTableProps> = ({ headers, rows, cboColumn, onExportAll }) => {
  const [limit, setLimit] = useState(100);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Filter headers based on the exclusion list
  const visibleHeaders = useMemo(() => {
    return headers.filter(header => 
      !COLUMNS_TO_HIDE_IN_TABLE.some(hidden => hidden.toUpperCase() === header.toUpperCase())
    );
  }, [headers]);

  const handleFilterChange = (header: string, value: string) => {
    setFilters(prev => ({ ...prev, [header]: value }));
    setLimit(100); // Reset pagination on filter change
  };

  const clearFilters = () => {
    setFilters({});
    setLimit(100);
  };

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter logic
  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([_, val]) => (val as string).trim() !== '');
    if (activeFilters.length === 0) return rows;

    return rows.filter(row => {
      return activeFilters.every(([header, filterValue]) => {
        const rawValue = row[header];
        let checkValue = String(rawValue || '').toLowerCase();
        const searchStr = (filterValue as string).toLowerCase();

        // Include CBO description in search scope for CBO column
        if (header === cboColumn) {
             const desc = getCboDescription(rawValue);
             checkValue = `${checkValue} ${desc.toLowerCase()}`;
        }

        return checkValue.includes(searchStr);
      });
    });
  }, [rows, filters, cboColumn]);

  // Sorting logic
  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // If sorting by CBO column, sort by description text to match UI
      if (sortConfig.key === cboColumn) {
        valA = getCboDescription(valA) || valA;
        valB = getCboDescription(valB) || valB;
      }

      // Handle null/undefined
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      // Use numeric sorting for number-like strings
      const comparison = strA.localeCompare(strB, undefined, { numeric: true });

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortConfig, cboColumn]);

  const displayedRows = sortedRows.slice(0, limit);
  const hasMore = sortedRows.length > limit;
  const isFiltering = Object.values(filters).some(v => (v as string).trim() !== '');

  return (
    <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">4. Dados Brutos</h2>
             {isFiltering && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                    {filteredRows.length} registros encontrados
                </span>
            )}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition shadow-md font-medium border flex-1 md:flex-none ${showFilters ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
            >
                <Filter size={18} />
                {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
            </button>
            
             {isFiltering && (
                <button
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-900/20 text-red-400 border border-red-900/40 hover:bg-red-900/30 transition shadow-md font-medium flex-1 md:flex-none"
                >
                    <X size={18} />
                    Limpar
                </button>
             )}

            <button 
              onClick={onExportAll}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-emerald-600 transition shadow-md font-medium flex-1 md:flex-none"
            >
              <Download size={18} />
              Exportar
            </button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-600 shadow-inner max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700 sticky top-0 z-20 shadow-sm">
            <tr>
              {visibleHeaders.map((h, i) => {
                const isSorted = sortConfig?.key === h;
                return (
                  <th 
                    key={i} 
                    scope="col" 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap min-w-[150px] cursor-pointer hover:bg-gray-600 hover:text-white transition-colors select-none group"
                    onClick={() => handleSort(h)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{h === cboColumn ? 'Nomenclatura CBO' : h}</span>
                      <span className="text-gray-500 group-hover:text-gray-300">
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
            {showFilters && (
                <tr className="bg-gray-800">
                    {visibleHeaders.map((h, i) => (
                        <th key={`filter-${i}`} className="px-2 py-2 bg-gray-800 border-b border-gray-600">
                             <input
                                type="text"
                                placeholder="Filtrar..."
                                value={filters[h] || ''}
                                onChange={(e) => handleFilterChange(h, e.target.value)}
                                className="w-full px-3 py-1.5 text-sm bg-gray-900 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-600 transition-colors"
                             />
                        </th>
                    ))}
                </tr>
            )}
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {displayedRows.length > 0 ? (
              displayedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-700 transition-colors group">
                  {visibleHeaders.map((h, i) => {
                    const isCbo = h === cboColumn;
                    const cellValue = row[h];
                    const displayValue = isCbo 
                      ? (getCboDescription(cellValue) || cellValue) 
                      : cellValue;

                    return (
                      <td key={i} className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 border-r border-gray-700 last:border-r-0 group-hover:border-gray-600">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleHeaders.length} className="px-6 py-12 text-center text-gray-500">
                  {isFiltering 
                    ? 'Nenhum registro encontrado com os filtros atuais.' 
                    : 'Nenhum dado para exibir.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {hasMore && (
        <div className="mt-4 text-center">
           <p className="text-sm text-gray-400 mb-2">
             Exibindo {limit} de {sortedRows.length} linhas.
           </p>
           <button 
             onClick={() => setLimit(prev => prev + 100)}
             className="text-primary hover:text-emerald-500 font-medium text-sm transition-colors"
           >
             Carregar mais 100...
           </button>
        </div>
      )}
    </div>
  );
};

export default RawDataTable;