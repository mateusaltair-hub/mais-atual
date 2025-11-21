import React, { useState, useMemo } from 'react';
import FileUpload from './components/FileUpload';
import MetricCard from './components/MetricCard';
import BreakdownList from './components/BreakdownList';
import DuplicatesSection from './components/DuplicatesSection';
import RawDataTable from './components/RawDataTable';
import { processFile } from './services/dataService';
import { analyzeData } from './services/analysisService';
import { exportAllDataToExcel, exportDuplicatesOnly } from './services/exportService';
import { ProcessedData, AnalysisMetrics, DuplicateGroup, GroupingItem } from './types';
import { LayoutDashboard, CheckCircle, AlertTriangle, Users, Coins } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const processedData = await processFile(file);
      setData(processedData);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo.');
    } finally {
      setLoading(false);
    }
  };

  const analysis = useMemo(() => {
    if (!data) return null;
    return analyzeData(data);
  }, [data]);

  return (
    <div className="min-h-screen pb-12 font-sans bg-background text-gray-100">
      {/* Header */}
      <header className="bg-surface border-b border-gray-700 py-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-3">
             <LayoutDashboard className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Dashboard de Análise de Dados
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Visualize seus dados de planilha, identifique duplicatas e calcule repasses financeiros instantaneamente.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* 1. Upload */}
        <FileUpload onFileUpload={handleFileUpload} />

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-gray-400">Processando dados...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-3" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {data && analysis && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 2. Summary Metrics */}
            <div className="bg-surface p-6 rounded-xl shadow-lg border border-gray-700">
               <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-2">
                 <Users className="text-secondary" />
                 2. Quadro Resumo
               </h2>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <MetricCard 
                    title="Total de Registros" 
                    value={analysis.metrics.totalProfessionals.toLocaleString('pt-BR')} 
                    colorClass="bg-emerald-900/20 border border-emerald-800" 
                    textColorClass="text-emerald-400" 
                  />
                  <MetricCard 
                    title="Profissionais Cadastrados (Sem Duplicidades)" 
                    value={analysis.metrics.uniqueRecords.toLocaleString('pt-BR')} 
                    colorClass="bg-blue-900/20 border border-blue-800" 
                    textColorClass="text-blue-400" 
                  />
                  <MetricCard 
                    title="Registros Duplicados" 
                    value={analysis.metrics.duplicateKeysCount.toLocaleString('pt-BR')} 
                    colorClass="bg-red-900/20 border border-red-800" 
                    textColorClass="text-red-400" 
                  />
                  <MetricCard 
                    title="Valor Total do Complemento" 
                    value={analysis.metrics.totalComplementoLoaded.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                    colorClass="bg-green-900/20 border border-green-800" 
                    textColorClass="text-green-400" 
                  />
                  <MetricCard 
                    title="Registros com Observação" 
                    value={analysis.metrics.recordsWithObservation.toLocaleString('pt-BR')} 
                    colorClass="bg-yellow-900/20 border border-yellow-800" 
                    textColorClass="text-yellow-400" 
                  />
                  <MetricCard 
                    title="Registros Validados" 
                    value={analysis.metrics.validatedRecords.toLocaleString('pt-BR')} 
                    colorClass="bg-indigo-900/20 border border-indigo-800" 
                    textColorClass="text-indigo-400" 
                  />
               </div>

               <h3 className="text-lg font-semibold text-gray-300 mb-4">Distribuição por Nomenclatura CBO</h3>
               <BreakdownList items={analysis.cboBreakdown} />
            </div>

            {/* 3. Duplicates Analysis */}
            <DuplicatesSection 
              totalExtraDuplicates={analysis.metrics.totalExtraDuplicates} 
              duplicates={analysis.duplicates}
              identifierName={data.identifierColumn}
              onExport={() => exportDuplicatesOnly(analysis.duplicates, data)}
            />

            {/* 4. Raw Data & Full Export */}
            <RawDataTable 
              headers={data.headers} 
              rows={data.rows}
              cboColumn={data.cboColumn}
              onExportAll={() => exportAllDataToExcel(data, analysis.metrics, analysis.duplicates, analysis.cboBreakdown, analysis.cboBreakdown)}
            />

          </div>
        )}

      </main>

      <footer className="mt-12 text-center text-sm text-gray-500 pb-8">
         Dashboard Web React • Processamento Local Seguro
      </footer>
    </div>
  );
};

export default App;