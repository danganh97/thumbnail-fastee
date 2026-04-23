import { Editor } from './Editor'
import { EditorPresence } from './EditorPresence'
import { ShareAllowedUser } from './ShareAllowedUser'
import { ShareSnapshot } from './ShareSnapshot'
import { User } from './User'

export function initModelAssociations(): void {
  User.hasMany(Editor, { foreignKey: 'userId', sourceKey: 'id' })
  Editor.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' })

  User.hasMany(ShareSnapshot, { foreignKey: 'userId', sourceKey: 'id' })
  ShareSnapshot.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' })

  Editor.hasMany(ShareSnapshot, { foreignKey: 'editorId', sourceKey: 'id' })
  ShareSnapshot.belongsTo(Editor, { foreignKey: 'editorId', targetKey: 'id' })

  ShareSnapshot.hasMany(ShareAllowedUser, { foreignKey: 'shareSnapshotId', sourceKey: 'id' })
  ShareAllowedUser.belongsTo(ShareSnapshot, { foreignKey: 'shareSnapshotId', targetKey: 'id' })

  Editor.hasMany(EditorPresence, { foreignKey: 'editorId', sourceKey: 'id' })
  EditorPresence.belongsTo(Editor, { foreignKey: 'editorId', targetKey: 'id' })

  User.hasMany(EditorPresence, { foreignKey: 'userId', sourceKey: 'id' })
  EditorPresence.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' })
}

export { User, Editor, ShareSnapshot, ShareAllowedUser, EditorPresence }
