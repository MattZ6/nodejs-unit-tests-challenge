import { AppError } from "../../../../shared/errors/AppError";

export namespace TransferError {
  export class UserNotFound extends AppError {
    constructor(message: string = 'User not found') {
      super(message, 404);
    }
  }

  export class InsufficientFunds extends AppError {
    constructor() {
      super('Insufficient funds', 400);
    }
  }
}
