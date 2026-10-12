/**
 * Motor Central de Cálculos Técnicos para Vidraçaria
 * Centraliza regras de m², arredondamento técnico, peso e precificação
 */

export interface GlassCalcInput {
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  pricePerM2: number;
  quantity?: number;
  applyMinBillableArea?: boolean; // Padrão vidreiro: mín 0.25m² ou 0.50m²
  minBillableM2?: number; // 0.25 padrão
  lapidationType?: 'NENHUMA' | 'RETA' | 'BISOTE' | 'CANTO_MOEDA';
  lapidationPricePerMeter?: number;
  holesCount?: number;
  holePrice?: number;
}

export interface GlassCalcResult {
  realAreaM2: number;
  billableAreaM2: number;
  weightKg: number;
  glassBasePrice: number;
  lapidationPrice: number;
  holesPrice: number;
  unitPrice: number;
  totalPrice: number;
  perimeterMeters: number;
}

export class GlassCalculationService {
  /** Densidade padrão do vidro float: ~2.50 kg por m² a cada 1mm de espessura */
  private static readonly GLASS_DENSITY = 2.5;

  /**
   * Arredonda valor para centavos de real (evitando problemas com ponto flutuante)
   */
  public static roundMoney(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Arredonda área técnica para 4 casas decimais
   */
  public static roundArea(val: number): number {
    return Math.round((val + Number.EPSILON) * 10000) / 10000;
  }

  /**
   * Realiza o cálculo técnico completo de uma peça de vidro
   */
  public static calculatePiece(input: GlassCalcInput): GlassCalcResult {
    const qty = Math.max(1, input.quantity || 1);
    const widthMm = Math.max(0, input.widthMm);
    const heightMm = Math.max(0, input.heightMm);
    const thicknessMm = Math.max(0, input.thicknessMm);
    const minM2 = input.minBillableM2 ?? 0.25;

    // Área real em m² = (L * A) / 1.000.000
    const realAreaM2 = this.roundArea((widthMm * heightMm) / 1000000);

    // No setor vidreiro, frações menores que a área mínima cobram o mínimo faturável
    const billableAreaM2 = input.applyMinBillableArea !== false
      ? Math.max(realAreaM2, minM2)
      : realAreaM2;

    // Peso teórico = Área real * espessura * 2.5 kg
    const weightKg = this.roundMoney(realAreaM2 * thicknessMm * this.GLASS_DENSITY);

    // Perímetro em metros lineares = 2 * (L + A) / 1000
    const perimeterMeters = this.roundArea((2 * (widthMm + heightMm)) / 1000);

    // Preço base do vidro
    const glassBasePrice = this.roundMoney(billableAreaM2 * input.pricePerM2);

    // Lapidação
    let lapidationPrice = 0;
    if (input.lapidationType && input.lapidationType !== 'NENHUMA' && input.lapidationPricePerMeter) {
      lapidationPrice = this.roundMoney(perimeterMeters * input.lapidationPricePerMeter);
    }

    // Furos e recortes
    let holesPrice = 0;
    if (input.holesCount && input.holesCount > 0 && input.holePrice) {
      holesPrice = this.roundMoney(input.holesCount * input.holePrice);
    }

    const unitPrice = this.roundMoney(glassBasePrice + lapidationPrice + holesPrice);
    const totalPrice = this.roundMoney(unitPrice * qty);

    return {
      realAreaM2,
      billableAreaM2,
      weightKg,
      glassBasePrice,
      lapidationPrice,
      holesPrice,
      unitPrice,
      totalPrice,
      perimeterMeters,
    };
  }

  /**
   * Arredonda dimensão para múltiplo de 50mm (prática comum de algumas fábricas de têmpera)
   */
  public static roundToCommercial50mm(mm: number): number {
    return Math.ceil(mm / 50) * 50;
  }
}
