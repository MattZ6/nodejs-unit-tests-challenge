import { getRepository, Repository } from "typeorm";

import { OperationType, Statement } from "../entities/Statement";
import { ICreateStatementDTO } from "../useCases/createStatement/ICreateStatementDTO";
import { IGetBalanceDTO } from "../useCases/getBalance/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../useCases/getStatementOperation/IGetStatementOperationDTO";
import { IStatementsRepository } from "./IStatementsRepository";

export class StatementsRepository implements IStatementsRepository {
  private repository: Repository<Statement>;

  constructor() {
    this.repository = getRepository(Statement);
  }

  async create({
    user_id,
    sender_id,
    amount,
    description,
    type
  }: ICreateStatementDTO): Promise<Statement> {
    const statement = this.repository.create({
      user_id,
      sender_id,
      amount,
      description,
      type
    });

    return this.repository.save(statement);
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.repository.findOne(statement_id, {
      where: { user_id }
    });
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number } | { balance: number, statement: Statement[] }
    >
  {
    const query = this.repository.createQueryBuilder()
      .where(`user_id = :userId`, { userId: user_id })
      .orWhere(`sender_id = :senderId`, { senderId: user_id });

    const statements = await query.getMany();

    const balance = statements.reduce((acc, operation) => {
      if (operation.type == OperationType.DEPOSIT) {
        return acc + Number(operation.amount);
      }

      if (operation.type == OperationType.WITHDRAW) {
        return acc - Number(operation.amount);
      }

      if (operation.type === OperationType.TRANSFER) {
        if (operation.sender_id === user_id) {
          return acc - Number(operation.amount);
        }

        if (operation.user_id === user_id) {
          return acc + Number(operation.amount);
        }
      }

      return acc;
    }, 0)

    if (with_statement) {
      return {
        statement: statements,
        balance
      }
    }

    return { balance }
  }
}
