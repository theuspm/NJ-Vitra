import React, { useState } from 'react';
import {
  Building2,
  Save,
  FileText,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { useAuth } from '../../context/AuthContext';
import { CompanySettings } from '../../types';
import { PdfService } from '../../services/PdfService';

export const CompanySettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings, recordAuditLog, quotes, customers } = useVidracaria();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState<CompanySettings>({
    name: companySettings.name || 'Sua Vidraçaria',
    tradingName: companySettings.tradingName || 'Vidros & Esquadrias',
    cnpj: companySettings.cnpj || '',
    stateRegistration: companySettings.stateRegistration || '',
    phone: companySettings.phone || '',
    whatsapp: companySettings.whatsapp || '',
    email: companySettings.email || '',
    website: companySettings.website || '',
    address: companySettings.address || '',
    city: companySettings.city || 'São Paulo',
    state: companySettings.state || 'SP',
    zipCode: companySettings.zipCode || '',
    quotePolicyNotes:
      companySettings.quotePolicyNotes ||
      'Vidros de segurança temperados e laminados certificados conforme normas ABNT NBR 14698/14697. Instalação executada por equipe própria especializada.',
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('A Razão Social / Nome da Vidraçaria é obrigatório.');
      return;
    }
    if (!formData.cnpj.trim()) {
      setErrorMessage('O CNPJ é obrigatório.');
      return;
    }

    updateCompanySettings(formData);
    recordAuditLog(
      'UPDATE_COMPANY_SETTINGS',
      'CompanySettings',
      'config',
      `Dados cadastrais da vidraçaria atualizados por ${currentUser.name} (${formData.name})`
    );

    setSuccessMessage('Informações da vidraçaria atualizadas com sucesso! Os novos dados já serão aplicados em todos os orçamentos e PDFs emitidos.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as informações de exemplo padrão da vidraçaria?')) {
      const defaultData: CompanySettings = {
        name: 'VIDRAÇARIA CRISTAL MASTER & DESIGN',
        tradingName: 'Cristal Master Vidros & Esquadrias',
        cnpj: '18.492.831/0001-94',
        stateRegistration: '109.842.110.114',
        phone: '(11) 3921-8800',
        whatsapp: '(11) 98765-4321',
        email: 'comercial@cristalmaster.com.br',
        website: 'www.cristalmaster.com.br',
        address: 'Av. dos Engenheiros Vidreiros, 1420 - Distrito Industrial - São Paulo/SP',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04571-000',
        quotePolicyNotes:
          'Vidros de segurança temperados certificados conforme ABNT NBR 14698. Instalação executada por equipe especializada.',
      };
      setFormData(defaultData);
      updateCompanySettings(defaultData);
      setSuccessMessage('Dados restaurados para o padrão.');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Baixar PDF de demonstração com as informações atuais
  const handleDownloadTestPdf = () => {
    const sampleQuote = quotes[0];
    const sampleCustomer = customers[0];
    if (!sampleQuote || !sampleCustomer) {
      alert('Nenhum orçamento disponível para gerar o teste.');
      return;
    }
    PdfService.generateQuotePdf(sampleQuote, sampleCustomer, currentUser, formData);
  };

  return (
    <div className="space-y-6">
      {/* Topo / Título & Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Dados da Loja & Cabeçalho dos Documentos</span>
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Configure o nome da vidraçaria, CNPJ, telefones, WhatsApp e endereço que aparecem impressos no topo do PDF de orçamentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTestPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="Baixar um PDF demonstrativo para ver o cabeçalho impresso"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Gerar PDF de Teste</span>
          </button>

          <button
            form="companyForm"
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 shadow-xs">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* PREVIEW EM TEMPO REAL DO CABEÇALHO DO PDF */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Prévia em Tempo Real do Cabeçalho Impresso no PDF</span>
          </span>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            Atualiza automaticamente enquanto você digita
          </span>
        </div>

        {/* Card que simula o visual exato do PDF */}
        <div className="p-4 bg-[#F5F8FC] border-t-2 border-[#0F4C81] rounded-xl border-x border-b border-slate-200 shadow-inner flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h2 className="text-base font-black text-[#0F4C81] tracking-wide">
              {formData.name.toUpperCase() || 'NOME DA VIDRAÇARIA'}
            </h2>
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>
                <strong className="text-slate-800">CNPJ:</strong> {formData.cnpj || '00.000.000/0000-00'} |{' '}
                <strong className="text-slate-800">Fone:</strong> {formData.phone || '(00) 0000-0000'} |{' '}
                <strong className="text-slate-800">WhatsApp:</strong> {formData.whatsapp || '(00) 00000-0000'}
              </p>
              <p className="text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500 inline" />
                <span>
                  {formData.address || 'Endereço da Loja'}
                  {formData.city ? `, ${formData.city}` : ''}
                  {formData.state ? ` - ${formData.state}` : ''}
                  {formData.zipCode ? ` (CEP: ${formData.zipCode})` : ''}
                </span>
              </p>
              <p className="text-slate-600 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500 inline" />
                <span>E-mail: {formData.email || 'contato@vidracaria.com.br'}</span>
                {formData.website && <span> | Site: {formData.website}</span>}
              </p>
            </div>
          </div>

          <div className="bg-[#0F4C81] text-white p-3 rounded-lg flex flex-col justify-center items-center text-center shrink-0 min-w-[170px] shadow-sm">
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-100">
              ORÇAMENTO COMERCIAL
            </span>
            <span className="text-base font-black text-white">ORC-2026-0001</span>
            <span className="text-[9px] text-blue-200 mt-0.5">VERSÃO 1 | STATUS: EM_NEGOCIACAO</span>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE EDIÇÃO */}
      <form id="companyForm" onSubmit={handleSave} className="space-y-6">
        {/* Bloco 1: Identificação Cadastral */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Identificação da Vidraçaria & Razão Social
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Oficial / Razão Social no Cabeçalho *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: VIDRAÇARIA CRISTAL MASTER & DESIGN LTDA"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Este é o título principal que sai com maior destaque no topo do documento PDF.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Fantasia Comercial
              </label>
              <input
                type="text"
                value={formData.tradingName || ''}
                onChange={(e) => handleInputChange('tradingName', e.target.value)}
                placeholder="Ex: Cristal Master Vidros & Esquadrias"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inscrição Estadual (IE)
              </label>
              <input
                type="text"
                value={formData.stateRegistration || ''}
                onChange={(e) => handleInputChange('stateRegistration', e.target.value)}
                placeholder="Ex: 109.842.110.114 ou Isento"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Contatos Comerciais */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Telefones, WhatsApp & Contatos do Cabeçalho
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Fixo da Vidraçaria
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 3921-8800"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp Comercial / Orçamentos *
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail Comercial de Atendimento
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="comercial@vidracaria.com.br"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Website da Empresa
              </label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="www.minhavidracaria.com.br"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bloco 3: Endereço & Localização */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Endereço da Fábrica / Showroom
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Logradouro, Número e Bairro *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Av. dos Vidreiros, 1420 - Galpão 3 - Distrito Industrial"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.zipCode || ''}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 4: Frase Padrão / Observações do Orçamento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Observações & Políticas Padrão Impressas no PDF
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Texto Padrão de Condições & Normas ABNT (sai no campo de Observações do PDF)
            </label>
            <textarea
              rows={3}
              value={formData.quotePolicyNotes || ''}
              onChange={(e) => handleInputChange('quotePolicyNotes', e.target.value)}
              placeholder="Ex: Vidros de segurança temperados certificados conforme normas ABNT NBR 14698. Instalação executada por vidraceiros especializados."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Caso um orçamento específico não tenha observações personalizadas digitadas pelo vendedor, este texto institucional será impresso automaticamente.
            </span>
          </div>
        </div>

        {/* Barra de Ações Inferior */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Informações Originais</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadTestPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Baixar PDF de Exemplo</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
