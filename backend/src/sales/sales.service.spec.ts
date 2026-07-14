import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma.service';
import { HttpException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesService, PrismaService],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSale with concurrency check', () => {
    it('should throw an error if inventory quantity goes below zero (oversell)', async () => {
      // Mocking Prisma's $transaction to simulate the atomic check
      const txMock = {
        cashierSession: {
          findFirst: jest.fn().mockResolvedValue({ id: 'session_1', status: 'OPEN' }),
        },
        sale: {
          create: jest.fn().mockResolvedValue({ id: 'sale_1' }),
        },
        payment: {
          create: jest.fn().mockResolvedValue({}),
        },
        inventory: {
          findFirst: jest.fn().mockResolvedValue({ id: 'inv_1', quantity: 1 }), // Initially 1 left
          update: jest.fn().mockResolvedValue({ id: 'inv_1', quantity: -1 }), // After decrement, it became -1 (oversell)
        },
        inventoryTransaction: {
          create: jest.fn(),
        }
      };

      prisma.branch = {
        findFirst: jest.fn().mockResolvedValue({ id: 'branch_1' })
      } as any;

      prisma.user = {
        findFirst: jest.fn().mockResolvedValue({ id: 'user_1' })
      } as any;

      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(txMock);
      });

      // Attempt to sell 2 items when only 1 is in stock
      const payload = {
        items: [{ medicineId: 'med_1', quantity: 2, unitPrice: 100 }],
        totalAmount: 200,
        paymentMethod: 'CASH'
      };

      await expect(service.createSale(payload)).rejects.toThrow(HttpException);
      await expect(service.createSale(payload)).rejects.toThrow("Omborda yetarli qoldiq yo'q");
    });
  });
});
