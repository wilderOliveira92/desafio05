import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface CreateTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    category,
    type,
  }: CreateTransaction): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepo = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();

      if (value >= balance.total) {
        throw new AppError('Deu ruim', 400);
      }
    }
    const categoryExists = await categoryRepo.findOne({
      where: {
        title: category,
      },
    });
    console.log('aqui: ', categoryExists);
    let category_id = '';
    if (!categoryExists) {
      const newCategory = await categoryRepo.create({
        title: category,
      });
      await categoryRepo.save(newCategory);
      console.log('aqui: ', newCategory);
      category_id = newCategory.id;
    } else {
      category_id = categoryExists.id;
    }

    const transaction = await transactionRepository.create({
      title,
      value,
      category_id,
      type,
    });

    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
