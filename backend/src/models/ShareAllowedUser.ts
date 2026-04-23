import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../lib/sequelize'

export interface ShareAllowedUserAttributes {
  id: string
  shareSnapshotId: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}

type ShareAllowedUserCreationAttributes = Optional<ShareAllowedUserAttributes, 'createdAt' | 'updatedAt'>

export class ShareAllowedUser extends Model<ShareAllowedUserAttributes, ShareAllowedUserCreationAttributes> implements ShareAllowedUserAttributes {
  declare id: string
  declare shareSnapshotId: string
  declare email: string
  declare createdAt: Date
  declare updatedAt: Date
}

ShareAllowedUser.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    shareSnapshotId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'share_snapshot_id',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    tableName: 'share_allowed_users',
    timestamps: true,
  },
)
