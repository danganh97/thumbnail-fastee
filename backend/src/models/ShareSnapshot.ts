import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../lib/sequelize'

export interface ShareSnapshotAttributes {
  id: string
  userId: string | null
  shortUrl: string
  editorId: string
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  expiresAt: Date | null
  createdAt?: Date
  updatedAt?: Date
}

type ShareSnapshotCreationAttributes = Optional<
  ShareSnapshotAttributes,
  'userId' | 'accessMode' | 'permissionMode' | 'expiresAt' | 'createdAt' | 'updatedAt'
>

export class ShareSnapshot extends Model<ShareSnapshotAttributes, ShareSnapshotCreationAttributes> implements ShareSnapshotAttributes {
  declare id: string
  declare userId: string | null
  declare shortUrl: string
  declare editorId: string
  declare accessMode: 'anyone' | 'specific_users'
  declare permissionMode: 'view' | 'edit'
  declare expiresAt: Date | null
  declare createdAt: Date
  declare updatedAt: Date
}

ShareSnapshot.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'user_id',
    },
    shortUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'short_url',
    },
    editorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'editor_id',
    },
    accessMode: {
      type: DataTypes.ENUM('anyone', 'specific_users'),
      allowNull: false,
      defaultValue: 'anyone',
      field: 'access_mode',
    },
    permissionMode: {
      type: DataTypes.ENUM('view', 'edit'),
      allowNull: false,
      defaultValue: 'edit',
      field: 'permission_mode',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
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
    tableName: 'share_snapshots',
    timestamps: true,
  },
)
