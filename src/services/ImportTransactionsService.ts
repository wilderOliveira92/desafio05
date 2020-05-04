import { getRepository, getCustomRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransacrionRepository from '../repositories/TransactionsRepository';

import CreateTransactionService from './CreateTransactionService';

interface File {
  filename: string;
  filepath: string;
}

interface ArquivoCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename, filepath }: File): Promise<Transaction[]> {
    const transactionRepo = getRepository(Transaction);
    const categoryRepo = getRepository(Category);

    // const lines = await transacrionRepository.readArqCSV(filepath);

    const readCSVStream = fs.createReadStream(filepath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCsv = readCSVStream.pipe(parseStream);

    const transactions: ArquivoCSV[] = [];
    const categories: string[] = [];
    parseCsv.on('data', async line => {
      // const [title, type, value, category] = line;
      console.log(line);
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });
    const existentsCategories = await categoryRepo.find({
      where: {
        title: In(categories),
      },
    });

    console.log('existentsCategories', existentsCategories);

    const existentsCategoriesTitle = await existentsCategories.map(
      (category: Category) => category.title,
    );

    console.log('existentsCategoriesTitle', existentsCategoriesTitle);

    const addCategories = categories
      .filter(category => !existentsCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);
    console.log('addCategories', addCategories);
    const newCategories = categoryRepo.create(
      addCategories.map(title => ({
        title,
      })),
    );
    console.log('newCategories', newCategories);
    await categoryRepo.save(newCategories);

    const finalCategories = [...newCategories, ...existentsCategories];

    const createdTransactions = transactionRepo.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepo.save(createdTransactions);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
