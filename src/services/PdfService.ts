import jsPDF from 'jspdf';
import { Quote, Customer, User, CompanySettings } from '../types';

export class PdfService {
  /**
   * Gera e faz o download do PDF oficial de Orçamento de Vidraçaria
   * com tipografia ampliada, descrições em CAIXA ALTA e alta legibilidade.
   */
  public static generateQuotePdf(
    quote: Quote,
    customer: Customer,
    seller: User,
    companyDetails?: Partial<CompanySettings>
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Recupera dados customizados da vidraçaria do LocalStorage se não fornecidos
    let storedSettings: Partial<CompanySettings> | null = null;
    try {
      const stored = localStorage.getItem('vidrogestao_company_settings');
      if (stored) {
        storedSettings = JSON.parse(stored);
      }
    } catch (err) {
      console.error(err);
    }

    const company = {
      name: companyDetails?.name || storedSettings?.name || 'VIDRAÇARIA CRISTAL MASTER & DESIGN',
      cnpj: companyDetails?.cnpj || storedSettings?.cnpj || '18.492.831/0001-94',
      phone: companyDetails?.phone || storedSettings?.phone || '(11) 3921-8800',
      whatsapp: companyDetails?.whatsapp || storedSettings?.whatsapp || '(11) 98765-4321',
      email: companyDetails?.email || storedSettings?.email || 'comercial@cristalmaster.com.br',
      address:
        companyDetails?.address ||
        storedSettings?.address ||
        'Av. dos Engenheiros Vidreiros, 1420 - Distrito Industrial - São Paulo/SP',
      quotePolicyNotes:
        companyDetails?.quotePolicyNotes ||
        storedSettings?.quotePolicyNotes ||
        'Vidros de segurança temperados certificados conforme ABNT NBR 14698.',
    };

    const activeVersion =
      quote.versions.find((v) => v.versionNumber === quote.currentVersion) ||
      quote.versions[0];
    const items = activeVersion?.items || [];

    // Paleta de cores corporativa de vidraçaria
    const primaryColor = [15, 76, 129]; // Azul Vidro / Safira (#0F4C81)
    const secondaryColor = [60, 75, 95];
    const lightBg = [245, 248, 252];
    const tableHeaderBg = [225, 236, 248];

    let y = 12;

    // ==========================================
    // 1. CABEÇALHO DA EMPRESA
    // ==========================================
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(10, y, 190, 28, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1.0);
    doc.line(10, y, 200, y);

    // Nome da Empresa em destaque (Fonte maior)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(company.name.toUpperCase(), 14, y + 8);

    // Informações de Contato da Empresa (Fontes ampliadas para 8.5pt)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`CNPJ: ${company.cnpj} | Fone: ${company.phone} | WhatsApp: ${company.whatsapp}`, 14, y + 14.5);
    doc.text(company.address, 14, y + 19.5);
    doc.text(`E-mail: ${company.email}`, 14, y + 24.5);

    // Box do Número do Orçamento (Topo direito)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(142, y + 2.5, 54, 23, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('ORÇAMENTO COMERCIAL', 145, y + 8.5);
    doc.setFontSize(14);
    doc.text(quote.quoteNumber, 145, y + 16);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`VERSÃO ${activeVersion?.versionNumber || 1} | STATUS: ${quote.status}`, 145, y + 21);

    y += 33;

    // ==========================================
    // 2. DADOS DO CLIENTE & PROJETO (BOX AMPLIADO)
    // ==========================================
    doc.setFillColor(252, 253, 255);
    doc.setDrawColor(215, 225, 235);
    doc.setLineWidth(0.3);
    doc.rect(10, y, 190, 31, 'FD');

    // Título do Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('DADOS DO CLIENTE & PROJETO', 14, y + 6.5);

    // Informações do Cliente (Fontes 9pt - 9.5pt com rótulos em negrito)
    doc.setFontSize(9);
    doc.setTextColor(20, 30, 45);

    const effectiveName = (quote.customerName || customer?.name || 'Consumidor').toUpperCase();
    const effectiveDoc = quote.customerDocument || customer?.document;
    const effectivePhone = quote.customerPhone || customer?.whatsapp || customer?.phone;

    let docText = '';
    if (effectiveDoc) {
      docText = effectiveDoc.length > 11 ? `CNPJ: ${effectiveDoc}` : `CPF: ${effectiveDoc}`;
    }
    if (effectivePhone) {
      docText = docText ? `${docText}  |  WhatsApp: ${effectivePhone}` : `WhatsApp: ${effectivePhone}`;
    }
    if (!docText) docText = 'Não informado';
    
    // Coluna Esquerda
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 14, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(effectiveName, 30, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', 14, y + 18.5);
    doc.setFont('helvetica', 'normal');
    doc.text(docText, 35, y + 18.5);

    doc.setFont('helvetica', 'bold');
    doc.text('Instalação:', 14, y + 24);
    doc.setFont('helvetica', 'normal');
    const installAddr = (quote.installationAddress || 'A combinar com o cliente / Balcão da fábrica').toUpperCase();
    doc.text(installAddr.substring(0, 58), 34, y + 24);

    // Coluna Direita
    doc.setFont('helvetica', 'bold');
    doc.text('Emissão:', 138, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(quote.issueDate).toLocaleDateString('pt-BR'), 158, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('Validade:', 138, y + 18.5);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(quote.validUntil).toLocaleDateString('pt-BR'), 158, y + 18.5);

    const effectiveSeller = (quote.sellerName || seller?.name || 'Vendas').toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.text('Vendedor:', 138, y + 24);
    doc.setFont('helvetica', 'normal');
    doc.text(effectiveSeller, 158, y + 24);

    y += 37;

    // ==========================================
    // 3. TABELA DE ESPECIFICAÇÃO DE ITENS
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('ESPECIFICAÇÃO TÉCNICA DOS MATERIAIS E SERVIÇOS', 10, y);

    y += 4.5;

    // Função auxiliar para desenhar o cabeçalho da tabela
    const drawTableHeader = (posY: number) => {
      doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
      doc.rect(10, posY, 190, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 40, 65);

      doc.text('#', 12, posY + 5.5);
      doc.text('CÓD.', 18, posY + 5.5);
      doc.text('DESCRIÇÃO DO ITEM / MEDIDAS (CAIXA ALTA)', 34, posY + 5.5);
      doc.text('QTD', 112, posY + 5.5);
      doc.text('UN', 123, posY + 5.5);
      doc.text('UNIT. (R$)', 134, posY + 5.5);
      doc.text('DESC. (R$)', 155, posY + 5.5);
      doc.text('TOTAL (R$)', 176, posY + 5.5);
    };

    drawTableHeader(y);
    y += 8;

    // Iteração dos itens com fonte maior, CAIXA ALTA e altura dinâmica
    items.forEach((item, index) => {
      // Montagem da descrição técnica em CAIXA ALTA
      let mainDesc = item.description;
      if (item.widthMm && item.heightMm) {
        mainDesc += ` (${item.widthMm}MM X ${item.heightMm}MM = ${item.areaM2 ? item.areaM2.toFixed(3) : '-'}M²)`;
      }
      const upperMainDesc = mainDesc.toUpperCase();

      const finishingUpper = item.finishingDetails ? item.finishingDetails.toUpperCase() : '';

      // Quebra de texto elegante para não cortar palavras
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const descLines = doc.splitTextToSize(upperMainDesc, 74);

      // Calcula a altura da linha com base no conteúdo
      let rowHeight = 11;
      if (descLines.length > 1 && finishingUpper) {
        rowHeight = 16;
      } else if (descLines.length > 1 || finishingUpper) {
        rowHeight = 13.5;
      }

      // Verificação de quebra de página
      if (y + rowHeight > 238) {
        doc.addPage();
        y = 15;
        drawTableHeader(y);
        y += 8;
      }

      // Zebra
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 253);
        doc.rect(10, y, 190, rowHeight, 'F');
      }

      doc.setDrawColor(225, 230, 238);
      doc.line(10, y + rowHeight, 200, y + rowHeight);

      // # e Código
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 50, 65);
      doc.text(String(index + 1), 12, y + 6);
      doc.text((item.code || '-').toUpperCase(), 18, y + 6);

      // DESCRIÇÃO DO ITEM EM CAIXA ALTA & FONTE MAIOR (9pt BOLD)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 30, 50);
      doc.text(descLines, 34, y + 5);

      // Detalhes de Acabamento / Lapidação em Caixa Alta
      if (finishingUpper) {
        const finishY = y + 5 + descLines.length * 4.2;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.8);
        doc.setTextColor(80, 95, 115);
        const finishLines = doc.splitTextToSize(`ACABAMENTO: ${finishingUpper}`, 74);
        doc.text(finishLines, 34, finishY);
      }

      // Valores numéricos com fonte 8.5pt - 9pt
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 45, 60);
      doc.text(String(item.quantity), 114, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(item.unit.toUpperCase(), 124, y + 6);

      doc.text(
        item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        135,
        y + 6
      );

      doc.text(
        item.discountAmount > 0
          ? item.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          : '-',
        157,
        y + 6
      );

      // Total do Item em Destaque
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(
        item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        176,
        y + 6
      );

      y += rowHeight;
    });

    y += 7;

    // ==========================================
    // 4. CONDIÇÕES COMERCIAIS & TOTAIS (FONTES AMPLIADAS)
    // ==========================================
    if (y + 40 > 275) {
      doc.addPage();
      y = 15;
    }

    // Box de Condições Comerciais
    doc.setFillColor(250, 252, 255);
    doc.setDrawColor(200, 215, 230);
    doc.rect(10, y, 110, 39, 'FD');

    // Box de Totais
    doc.rect(124, y, 76, 39, 'FD');

    // Condições Comerciais & Observações
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CONDIÇÕES COMERCIAIS & PAGAMENTO', 14, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(45, 55, 70);
    doc.text(
      `Previsão de Entrega / Instalação: ${quote.expectedDeliveryDays || 10} dias úteis após aprovação`,
      14,
      y + 13
    );
    if (quote.notes && quote.notes.trim()) {
      doc.text(
        `Observações: ${quote.notes.trim()}`,
        14,
        y + 18.5
      );
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 120, 135);
    doc.text('* Orçamento sujeito à confirmação de medição final no vão pelo técnico.', 14, y + 33);

    // Resumo de Totais Financeiros (Fontes Ampliadas)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 60, 75);

    doc.text('Subtotal dos Itens:', 128, y + 7.5);
    doc.text(
      `R$ ${quote.subtotalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      170,
      y + 7.5
    );

    doc.text(`Desconto Comercial (${quote.discountPercent}%):`, 128, y + 13.5);
    doc.text(
      `- R$ ${quote.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      170,
      y + 13.5
    );

    let offsetTotals = y + 19;
    if (quote.surchargeAmount > 0) {
      doc.text('Acréscimo / Encargos:', 128, offsetTotals);
      doc.text(
        `+ R$ ${quote.surchargeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        170,
        offsetTotals
      );
      offsetTotals += 5.5;
    }

    if (quote.freightAmount > 0) {
      doc.text('Frete / Deslocamento:', 128, offsetTotals);
      doc.text(
        `+ R$ ${quote.freightAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        170,
        offsetTotals
      );
      offsetTotals += 5.5;
    }

    // Linha divisória de destaque para o total
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.6);
    doc.line(126, y + 27, 198, y + 27);

    // VALOR FINAL EM DESTAQUE MÁXIMO (12pt BOLD)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('VALOR TOTAL:', 128, y + 34);
    doc.setFontSize(12.5);
    doc.text(
      `R$ ${quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      162,
      y + 34
    );

    // ==========================================
    // 5. RODAPÉ INSTITUCIONAL
    // ==========================================
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 145);
    doc.text(
      'VidroGestão ERP - Sistema Especializado para Vidraçarias e Beneficiamento | Emissão: ' +
        new Date().toLocaleString('pt-BR'),
      10,
      287
    );
    doc.text('Página 1 de 1', 184, 287);

    // Download do arquivo
    const safeCustomerName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${quote.quoteNumber}_${safeCustomerName}.pdf`);
  }
}
