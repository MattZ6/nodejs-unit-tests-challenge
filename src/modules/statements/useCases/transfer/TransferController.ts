import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { TransferUseCase } from './TransferUseCase';

export class TransferController {
  async execute(request: Request, response: Response) {
    const { id: sender_id } = request.user;
    const { receiver_id } = request.params;
    const { amount, description } = request.body;

    const transfer = container.resolve(TransferUseCase);

    const statement = await transfer.execute({
      sender_id,
      receiver_id,
      amount,
      description
    });

    return response.status(201).json(statement);
  }
}
