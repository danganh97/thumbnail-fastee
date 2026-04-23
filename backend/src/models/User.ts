import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../lib/sequelize'

export interface UserAttributes {
  id: string
  name: string | null
  email: string
  passwordHash: string | null
  createdAt?: Date
  updatedAt?: Date
}

type UserCreationAttributes = Optional<UserAttributes, 'name' | 'passwordHash' | 'createdAt' | 'updatedAt'>

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string
  declare name: string | null
  declare email: string
  declare passwordHash: string | null
  declare createdAt: Date
  declare updatedAt: Date
}

User.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  },
)
