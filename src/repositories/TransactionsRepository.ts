import { EntityRepository, Repository, getRepository } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface ArquivoCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionRepository = getRepository(Transaction);

    const transactions = await transactionRepository.find();

    const income = await transactions.reduce((total, transaction) => {
      return (total += transaction.type === 'income' ? transaction.value : 0);
    }, 0);

    const outcome = await transactions.reduce((total, transaction) => {
      return (total += transaction.type === 'outcome' ? transaction.value : 0);
    }, 0);

    const total = income - outcome;

    return { income, outcome, total };
  }

  public async readArqCSV(filepath: string): Promise<ArquivoCSV[]> {
    const readCSVStream = fs.createReadStream(filepath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCsv = readCSVStream.pipe(parseStream);

    const linesAqr: ArquivoCSV[] = [];
    // const lines:string[] = [];
    parseCsv.on('data', line => {
      const [title, type, value, category] = line;

      linesAqr.push({
        title,
        type,
        value,
        category,
      });
      // lines.push(line);
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });

    return linesAqr;
  }
}

export default TransactionsRepository;
