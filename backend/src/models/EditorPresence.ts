import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../lib/sequelize'

export interface EditorPresenceAttributes {
  id: string
  editorId: string
  sessionId: string
  userId: string | null
  displayName: string
  lastSeenAt: Date
  createdAt?: Date
  updatedAt?: Date
}

type EditorPresenceCreationAttributes = Optional<EditorPresenceAttributes, 'userId' | 'createdAt' | 'updatedAt'>

export class EditorPresence extends Model<EditorPresenceAttributes, EditorPresenceCreationAttributes> implements EditorPresenceAttributes {
  declare id: string
  declare editorId: string
  declare sessionId: string
  declare userId: string | null
  declare displayName: string
  declare lastSeenAt: Date
  declare createdAt: Date
  declare updatedAt: Date
}

EditorPresence.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    editorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'editor_id',
    },
    sessionId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'session_id',
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'user_id',
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'display_name',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'last_seen_at',
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
    tableName: 'editor_presence',
    timestamps: true,
  },
)
