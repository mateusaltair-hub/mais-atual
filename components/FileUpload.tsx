import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-surface p-8 rounded-xl shadow-sm border border-gray-700 text-center">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">1. Carregar Dados</h2>
      <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-6 hover:bg-gray-700 transition-colors">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Upload className="w-10 h-10 mb-2 text-primary" />
          <p className="font-medium text-gray-300">Clique para selecionar ou arraste o arquivo aqui</p>
          <p className="text-sm mt-1 text-gray-500">Suporta .xlsx, .xls, .csv</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;