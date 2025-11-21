import React, { useState } from 'react';
import { DuplicateGroup } from '../types';
import { formatCpf } from '../services/utils';
import { AlertCircle, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';

interface DuplicatesSectionProps {
  totalExtraDuplicates: number;
  duplicates: DuplicateGroup[];
  onExport: () => void;
  identifierName: string | null;
}

const DuplicatesSection: React.FC<DuplicatesSectionProps> = ({ totalExtraDuplicates, duplicates, onExport, identifierName }) => {
  const [showList, setShowList] = useState(false);

  const isDuplicates = totalExtraDuplicates > 0;
  const isCpf = identifierName?.toUpperCase().includes('CPF');

  return (
    <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-white">3. Análise de Duplicados e Qualidade</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className={`${isDuplicates ? 'bg-red-900/20 border-red-900/50' : 'bg-gray-700 border-gray-600'} p-4 rounded-lg shadow-sm flex justify-between items-center border`}>
          <div>
            <p className={`text-sm font-medium ${isDuplicates ? 'text-red-400' : 'text-gray-400'}`}>Total de Duplicados (Extras)</p>
            <p className={`text-3xl font-bold mt-1 ${isDuplicates ? 'text-red-400' : 'text-gray-300'}`}>
              {totalExtraDuplicates.toLocaleString('pt-BR')}
            </p>
          </div>
          <button 
            onClick={() => setShowList(!showList)}
            disabled={!isDuplicates}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
              ${isDuplicates 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
          >
             {showList ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
             {showList ? 'Ocultar Lista' : 'Listar'}
          </button>
        </div>

        <button
          onClick={onExport}
          disabled={!isDuplicates}
          className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg text-sm font-semibold transition-all shadow-md w-full md:w-auto
            ${isDuplicates 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
        >
          <FileSpreadsheet size={20} />
          Exportar Resumo Excel
        </button>
      </div>

      {showList && isDuplicates && (
        <div className="mt-6 animate-fadeIn">
          <h3 className="text-lg font-semibold text-red-400 mb-3 border-b border-red-900/50 pb-2">Resumo de Chaves Duplicadas ({identifierName})</h3>
          <div className="overflow-x-auto border border-red-900/30 rounded-lg shadow-inner max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-red-900/30 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-300 uppercase tracking-wider">{identifierName}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-300 uppercase tracking-wider">CNES 1</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-300 uppercase tracking-wider">CNES 2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-red-300 uppercase tracking-wider">Ocorrências</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {duplicates.map((item, idx) => (
                  <tr key={idx} className="hover:bg-red-900/10 transition-colors">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-300">
                      {isCpf ? formatCpf(item.key) : item.key}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{item.cnes1 || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{item.cnes2 || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-red-400 font-bold">{item.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center text-sm text-gray-500">
             <AlertCircle size={16} className="mr-1 text-red-500" />
             <span>Mostrando resumo agrupado. CNES 1 e 2 indicam os primeiros vínculos encontrados.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicatesSection;