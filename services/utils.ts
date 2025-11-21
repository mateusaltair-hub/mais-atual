import { CBO_MAPPING, CNES_MAPPING, VALOR_BASE_GERAL, VALORES_TECNICO, VALORES_ENFERMEIRO } from '../constants';

export function formatCpf(cpf: string | number): string {
  if (!cpf) return '';
  const numbers = String(cpf).replace(/\D/g, '');
  if (numbers.length !== 11) return String(cpf);
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function parseCurrency(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim();
  str = str.replace(/[R$\s]/g, '');
  if (str.indexOf(',') > -1) {
    str = str.replace(/\./g, '').replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function getCboDescription(code: string | number | undefined): string {
  if (!code) return '';
  const cleanCode = String(code).replace(/\D/g, '').substring(0, 6);
  return CBO_MAPPING[cleanCode] || '';
}

export function getCnesDescription(code: string | number | undefined): string {
  if (!code) return '';
  const cleanCode = String(code).replace(/\D/g, '');
  return CNES_MAPPING[cleanCode] || '';
}

export function getValorBaseCalculo(cboCode: string | number | undefined, jornada: number): number {
  if (!cboCode) return 0;
  const cleanCode = String(cboCode).replace(/\D/g, '').substring(0, 6);
  const isTecnico = cleanCode.startsWith('3222');
  const isEnfermeiro = cleanCode.startsWith('2235');
  const cleanJornada = Math.floor(jornada);

  if (isTecnico) {
    return VALORES_TECNICO[cleanJornada as keyof typeof VALORES_TECNICO] || VALOR_BASE_GERAL;
  }
  if (isEnfermeiro) {
    return VALORES_ENFERMEIRO[cleanJornada as keyof typeof VALORES_ENFERMEIRO] || VALOR_BASE_GERAL;
  }
  return VALOR_BASE_GERAL;
}

export function findColumn(headers: string[], identifiers: string[]): string | null {
  for (const id of identifiers) {
    const found = headers.find(h => h.toUpperCase().includes(id));
    if (found) return found;
  }
  return null;
}
