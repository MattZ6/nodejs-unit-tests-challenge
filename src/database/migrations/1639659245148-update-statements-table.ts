import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class updateStatementsTable1639659245148 implements MigrationInterface {
  private readonly TABLE_NAME = 'statements';
  private readonly TYPE_COLUMN_NAME = 'type';
  private readonly SENDER_ID_COLUMN_NAME = 'sender_id';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(this.TABLE_NAME, this.TYPE_COLUMN_NAME);

    await queryRunner.addColumns(this.TABLE_NAME, [
      new TableColumn({
        name: this.TYPE_COLUMN_NAME,
        type: 'enum',
        enum: ['deposit', 'withdraw', 'transfer'],
      }),
      new TableColumn({
        name: this.SENDER_ID_COLUMN_NAME,
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(this.TABLE_NAME, new TableForeignKey({
      columnNames: [this.SENDER_ID_COLUMN_NAME],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(this.TABLE_NAME, [
      this.TYPE_COLUMN_NAME,
      this.SENDER_ID_COLUMN_NAME,
    ]);

    await queryRunner.addColumn(this.TABLE_NAME, new TableColumn({
      name: this.TYPE_COLUMN_NAME,
      type: 'enum',
      enum: ['deposit', 'withdraw']
    }));
  }

}
