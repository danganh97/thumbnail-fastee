import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../lib/sequelize'

export interface EditorAttributes {
  id: string
  name: string | null
  userId: string | null
  payloadJson: string | null
  createdAt?: Date
  updatedAt?: Date
}

type EditorCreationAttributes = Optional<EditorAttributes, 'name' | 'userId' | 'payloadJson' | 'createdAt' | 'updatedAt'>

export class Editor extends Model<EditorAttributes, EditorCreationAttributes> implements EditorAttributes {
  declare id: string
  declare name: string | null
  declare userId: string | null
  declare payloadJson: string | null
  declare createdAt: Date
  declare updatedAt: Date
}

Editor.init(
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
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'user_id',
    },
    payloadJson: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: 'payload_json',
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
    tableName: 'editors',
    timestamps: true,
  },
)
