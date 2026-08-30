const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
  name: "CreditPackage",
  tableName: "credit_package",
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false,
    },
    name: {
      type: 'varchar',
      nullable: false,
      unique: true,
    },
    credit_amount: {
      type: 'integer',
      nullable: false,
    },
    price: {
      type: 'integer',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false
    }
  },
});