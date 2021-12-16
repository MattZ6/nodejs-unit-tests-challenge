import { Statement } from "../entities/Statement";

type StatementDTO = {
  id: string;
  sender_id?: string;
  amount: number;
  description: string;
  type: string;
  created_at: Date;
  updated_at: Date;
}

export class BalanceMap {
  static toDTO({statement, balance}: { statement: Statement[], balance: number}) {
    const parsedStatement = statement.map(statement => {
      const dto: StatementDTO = {
        id: statement.id!,
        amount: Number(statement.amount),
        description: statement.description,
        type: statement.type,
        created_at: statement.created_at,
        updated_at: statement.updated_at
      };

      if (statement.sender_id) {
        dto.sender_id = statement.sender_id;
      }

      return dto;
    });

    return {
      statement: parsedStatement,
      balance: Number(balance)
    }
  }
}
