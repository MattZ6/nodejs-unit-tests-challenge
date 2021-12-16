import { inject, injectable } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { TransferError } from "./CreateStatementError";
import { ITransferDTO } from "./ITransferDTO";

@injectable()
export class TransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ sender_id, receiver_id, amount, description }: ITransferDTO) {
    const sender = await this.usersRepository.findById(sender_id);

    if(!sender) {
      throw new TransferError.UserNotFound('Sender user not found');
    }

    const receiver = await this.usersRepository.findById(receiver_id);

    if(!receiver) {
      throw new TransferError.UserNotFound('Receiver user not found');
    }

    const { balance } = await this.statementsRepository.getUserBalance({ user_id: sender_id });

    if (balance < amount) {
      throw new TransferError.InsufficientFunds()
    }

    const statement = await this.statementsRepository.create({
      user_id: receiver_id,
      sender_id,
      type: OperationType.TRANSFER,
      amount,
      description
    });

    return statement;
  }
}
