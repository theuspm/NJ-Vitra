import { UserRoleType } from '../types';

export interface DiscountValidationResult {
  isValid: boolean;
  maxAllowedPercent: number;
  message: string;
}

export class DiscountPolicyService {
  /**
   * Retorna o limite percentual máximo de desconto permitido por perfil
   */
  public static getMaxDiscountPercentForRole(role: UserRoleType): number {
    switch (role) {
      case 'ADMINISTRADOR':
        return 100.0; // Sem teto pré-configurado
      case 'GERENTE':
        return 10.0; // Limite de 10%
      case 'VENDEDOR':
        return 5.0; // Limite de 5%
      case 'ESTOQUISTA':
      case 'PRODUCAO':
      case 'FINANCEIRO':
      default:
        return 0.0; // Não possuem alçada para conceder desconto comercial
    }
  }

  /**
   * Valida se um desconto comercial pretendido está dentro da alçada do usuário
   */
  public static validateDiscount(
    role: UserRoleType,
    requestedPercent: number
  ): DiscountValidationResult {
    const max = this.getMaxDiscountPercentForRole(role);
    const normalizedPercent = Math.max(0, requestedPercent);

    if (normalizedPercent > max) {
      return {
        isValid: false,
        maxAllowedPercent: max,
        message: `Desconto de ${normalizedPercent.toFixed(1)}% excede a sua alçada permitida (${max.toFixed(1)}% para o perfil ${role}). Solicite aprovação gerencial ou administrativa.`,
      };
    }

    return {
      isValid: true,
      maxAllowedPercent: max,
      message: `Desconto autorizado dentro do limite de ${max.toFixed(1)}%.`,
    };
  }
}
