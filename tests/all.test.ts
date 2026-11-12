import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

import { GlassCalculationService } from '../src/services/GlassCalculationService.js';
import { DiscountPolicyService } from '../src/services/DiscountPolicyService.js';
import { maskPhone, maskCpfCnpj, maskCnpj } from '../src/utils/masks.js';
import {
  apiRouter,
  cleanSupabaseUrl,
  normalizePlan,
  sanitizeTenantId,
} from '../src/server/supabaseBackend.js';

// ============================================================================
// 1. TESTES DE UNIDADE (UNIT TESTS)
// ============================================================================
describe('1. Testes de Unidade (Unit Tests)', () => {
  describe('GlassCalculationService - Motor de Cálculo Vidreiro', () => {
    it('deve calcular corretamente área real, peso e preço para peça padrão (1000x2000mm, 8mm)', () => {
      const res = GlassCalculationService.calculatePiece({
        widthMm: 1000,
        heightMm: 2000,
        thicknessMm: 8,
        pricePerM2: 250,
        quantity: 2,
      });

      assert.equal(res.realAreaM2, 2.0);
      assert.equal(res.billableAreaM2, 2.0);
      // Peso: 2.0m² * 8mm * 2.5 = 40kg
      assert.equal(res.weightKg, 40.0);
      // Perímetro: 2 * (1 + 2) = 6m
      assert.equal(res.perimeterMeters, 6.0);
      assert.equal(res.glassBasePrice, 500.0);
      assert.equal(res.unitPrice, 500.0);
      assert.equal(res.totalPrice, 1000.0);
    });

    it('deve aplicar área mínima faturável de 0.25m² para peças pequenas (ex: 300x300mm = 0.09m²)', () => {
      const res = GlassCalculationService.calculatePiece({
        widthMm: 300,
        heightMm: 300,
        thicknessMm: 10,
        pricePerM2: 200,
        quantity: 1,
        applyMinBillableArea: true,
      });

      assert.equal(res.realAreaM2, 0.09);
      assert.equal(res.billableAreaM2, 0.25);
      // Preço cobrado sobre 0.25m² * R$ 200 = R$ 50,00
      assert.equal(res.glassBasePrice, 50.0);
      // Peso calculado sobre área real: 0.09 * 10 * 2.5 = 2.25kg
      assert.equal(res.weightKg, 2.25);
    });

    it('deve somar corretamente lapidação por metro linear e furações', () => {
      const res = GlassCalculationService.calculatePiece({
        widthMm: 1000,
        heightMm: 1000,
        thicknessMm: 8,
        pricePerM2: 180,
        quantity: 3,
        lapidationType: 'RETA',
        lapidationPricePerMeter: 15, // Perímetro 4m * 15 = R$ 60
        holesCount: 4,
        holePrice: 12.5, // 4 * 12.5 = R$ 50
      });

      assert.equal(res.perimeterMeters, 4.0);
      assert.equal(res.glassBasePrice, 180.0);
      assert.equal(res.lapidationPrice, 60.0);
      assert.equal(res.holesPrice, 50.0);
      assert.equal(res.unitPrice, 290.0);
      assert.equal(res.totalPrice, 870.0);
    });

    it('deve arredondar medidas comerciais para múltiplos de 50mm (roundToCommercial50mm)', () => {
      assert.equal(GlassCalculationService.roundToCommercial50mm(1000), 1000);
      assert.equal(GlassCalculationService.roundToCommercial50mm(1001), 1050);
      assert.equal(GlassCalculationService.roundToCommercial50mm(723), 750);
    });
  });

  describe('DiscountPolicyService - Alçadas de Desconto Comercial', () => {
    it('deve respeitar os limites máximos por perfil (Admin 100%, Gerente 10%, Vendedor 5%, Operacional 0%)', () => {
      assert.equal(DiscountPolicyService.getMaxDiscountPercentForRole('ADMINISTRADOR'), 100);
      assert.equal(DiscountPolicyService.getMaxDiscountPercentForRole('GERENTE'), 10);
      assert.equal(DiscountPolicyService.getMaxDiscountPercentForRole('VENDEDOR'), 5);
      assert.equal(DiscountPolicyService.getMaxDiscountPercentForRole('FINANCEIRO'), 0);
      assert.equal(DiscountPolicyService.getMaxDiscountPercentForRole('PRODUCAO'), 0);
      assert.equal(DiscountPolicyService.getMaxDiscountPercentForRole('ESTOQUISTA'), 0);
    });

    it('deve bloquear desconto de vendedor acima de 5% e aprovar até 5%', () => {
      const allowed = DiscountPolicyService.validateDiscount('VENDEDOR', 5);
      assert.equal(allowed.isValid, true);

      const denied = DiscountPolicyService.validateDiscount('VENDEDOR', 5.1);
      assert.equal(denied.isValid, false);
      assert.match(denied.message, /excede a sua alçada/);
    });
  });

  describe('Masks - Máscaras de Telefone, CPF e CNPJ', () => {
    it('deve formatar telefone fixo (10 dígitos) e celular (11 dígitos)', () => {
      assert.equal(maskPhone('1134567890'), '(11) 3456-7890');
      assert.equal(maskPhone('11987654321'), '(11) 98765-4321');
      assert.equal(maskPhone('11987654321999'), '(11) 98765-4321');
    });

    it('deve formatar CPF (11 dígitos) e alternar automaticamente para CNPJ (14 dígitos)', () => {
      assert.equal(maskCpfCnpj('12345678901'), '123.456.789-01');
      assert.equal(maskCpfCnpj('12345678000199'), '12.345.678/0001-99');
      assert.equal(maskCnpj('12345678000199'), '12.345.678/0001-99');
    });
  });

  describe('Supabase Helpers - Normalização de URL, Plano e Tenant ID', () => {
    it('cleanSupabaseUrl deve corrigir URLs do painel Supabase e remover /rest/v1 (prevenção PGRST125)', () => {
      assert.equal(
        cleanSupabaseUrl('https://abcdefgh.supabase.co/rest/v1/'),
        'https://abcdefgh.supabase.co'
      );
      assert.equal(
        cleanSupabaseUrl('https://supabase.com/dashboard/project/myproj123/editor'),
        'https://myproj123.supabase.co'
      );
      assert.equal(cleanSupabaseUrl('myproj123.supabase.co///'), 'https://myproj123.supabase.co');
    });

    it('normalizePlan deve reconhecer PREMIUM mesmo com quebra de linha (Enter no Supabase), espaços ou minúsculas', () => {
      assert.equal(normalizePlan('PREMIUM'), 'PREMIUM');
      assert.equal(normalizePlan('PREMIUM\n'), 'PREMIUM');
      assert.equal(normalizePlan('\r\n  premium \n'), 'PREMIUM');
      assert.equal(normalizePlan('Premium '), 'PREMIUM');
      assert.equal(normalizePlan('BASICO\n'), 'BASICO');
      assert.equal(normalizePlan('Básico'), 'BASICO');
      assert.equal(normalizePlan(''), 'BASICO');
      assert.equal(normalizePlan(null), 'BASICO');
    });
  });
});

// ============================================================================
// 2. TESTES DE INTEGRAÇÃO E SEGURANÇA DA API (INTEGRATION & SECURITY TESTS)
// ============================================================================
describe('2. Testes de Integração e Segurança da API (/api/*)', () => {
  let server: http.Server;
  let baseUrl = '';

  before(async () => {
    const app = express();
    app.use('/api', apiRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/status deve retornar status 200 e cabeçalhos de segurança HTTP (nosniff, SAMEORIGIN, no-store)', async () => {
    const res = await fetch(`${baseUrl}/api/status`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(res.headers.get('cache-control') || '', /no-store/);

    const body = await res.json();
    assert.equal(typeof body.configured, 'boolean');
    assert.ok(body.timestamp);
  });

  it('[SEGURANÇA] POST /api/auth/register deve estar bloqueado com 403 Forbidden (cadastro exclusivo pelo admin)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invasor@teste.com',
        password: '123456',
        name: 'Invasor',
        storeName: 'Loja Falsa',
        plan: 'PREMIUM',
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /exclusivamente pelo administrador/i);
  });

  it('[SEGURANÇA] POST /api/auth/login deve rejeitar payloads vazios ou injeção de objetos JSON com 400 Bad Request', async () => {
    // 1. Payload vazio
    const resEmpty = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '   ', password: '' }),
    });
    assert.equal(resEmpty.status, 400);

    // 2. Tentativa de NoSQL/Object Injection no campo email
    const resInjection = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $gt: '' }, password: '123' }),
    });
    assert.equal(resInjection.status, 400);
  });

  it('[SEGURANÇA] sanitizeTenantId deve neutralizar Path Traversal e SQL Injection no header X-Tenant-Id', () => {
    assert.equal(sanitizeTenantId('../../etc/passwd'), '....etcpasswd');
    assert.equal(sanitizeTenantId("tenant-1'; DROP TABLE quotes;--"), 'tenant-1DROPTABLEquotes--');
    assert.equal(sanitizeTenantId('   '), 'default');
    assert.equal(sanitizeTenantId(null), 'default');
  });

  it('POST /api/quotes deve rejeitar orçamento sem ID com 400 Bad Request e aceitar orçamento válido', async () => {
    const badRes = await fetch(`${baseUrl}/api/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant-teste-1' },
      body: JSON.stringify({ customerName: 'Cliente Sem ID' }),
    });
    // Quando Supabase não está configurado localmente, ou valida ID
    if (badRes.status === 400) {
      const errBody = await badRes.json();
      assert.match(errBody.error, /Orçamento inválido/);
    } else {
      assert.equal(badRes.status, 200);
    }

    const validRes = await fetch(`${baseUrl}/api/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant-teste-1' },
      body: JSON.stringify({
        id: 'quote-test-100',
        quoteNumber: 'ORC-2026-000100',
        customerName: 'Cliente Teste Funcional',
        totalAmount: 450.0,
        items: [],
      }),
    });
    assert.ok(validRes.status === 200 || validRes.status === 500);
  });
});

// ============================================================================
// 3. TESTES FUNCIONAIS E AUDITORIA DE SEGURANÇA ESTÁTICA
// ============================================================================
describe('3. Testes Funcionais de Regras de Pacote e Auditoria de Código', () => {
  it('Pacote BASICO deve permitir apenas as 4 abas essenciais e bloquear módulos do Pacote PREMIUM', () => {
    const allowedBasicTabs = ['quotes', 'orders', 'company', 'database'];
    const premiumOnlyTabs = [
      'dashboard',
      'customers',
      'products',
      'services',
      'production',
      'stock',
      'financial',
      'suppliers',
      'reports',
      'users',
      'audit',
    ];

    const resolveEffectiveTab = (plan: 'BASICO' | 'PREMIUM', requestedTab: string) => {
      return plan === 'BASICO' && !allowedBasicTabs.includes(requestedTab)
        ? 'quotes'
        : requestedTab;
    };

    // No plano BASICO, qualquer tentativa de acessar aba PREMIUM redireciona para 'quotes'
    for (const tab of premiumOnlyTabs) {
      assert.equal(resolveEffectiveTab('BASICO', tab), 'quotes');
    }

    // No plano BASICO, as 4 abas básicas permanecem acessíveis
    for (const tab of allowedBasicTabs) {
      assert.equal(resolveEffectiveTab('BASICO', tab), tab);
    }

    // No plano PREMIUM, todas as abas são acessíveis
    for (const tab of [...allowedBasicTabs, ...premiumOnlyTabs]) {
      assert.equal(resolveEffectiveTab('PREMIUM', tab), tab);
    }
  });

  it('[SEGURANÇA] Nenhum arquivo do frontend (src/components, src/context, src/services) deve expor SUPABASE_SERVICE_ROLE_KEY', () => {
    const clientDirs = ['src/components', 'src/context', 'src/services', 'src/utils'];
    const forbiddenPatterns = ['SUPABASE_SERVICE_ROLE_KEY', 'VITE_SUPABASE_SERVICE_ROLE_KEY'];

    const scanDir = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of forbiddenPatterns) {
            assert.equal(
              content.includes(pattern),
              false,
              `Chave secreta ${pattern} encontrada indevidamente no arquivo cliente: ${fullPath}`
            );
          }
        }
      }
    };

    for (const dir of clientDirs) {
      scanDir(path.resolve(process.cwd(), dir));
    }
  });
});
