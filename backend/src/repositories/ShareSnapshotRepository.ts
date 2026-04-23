import { Editor, ShareAllowedUser, ShareSnapshot } from '../models'

export const ShareSnapshotRepository = {
  create(input: {
    id: string
    userId: string
    shortUrl: string
    editorId: string
    accessMode: 'anyone' | 'specific_users'
    permissionMode: 'view' | 'edit'
    expiresAt: Date | null
  }): Promise<ShareSnapshot> {
    return ShareSnapshot.create({
      id: input.id,
      userId: input.userId,
      shortUrl: input.shortUrl,
      editorId: input.editorId,
      accessMode: input.accessMode,
      permissionMode: input.permissionMode,
      expiresAt: input.expiresAt,
    })
  },

  findById(snapshotId: string): Promise<ShareSnapshot | null> {
    return ShareSnapshot.findByPk(snapshotId)
  },

  findWithEditorByCode(snapshotId: string, code: string): Promise<ShareSnapshot | null> {
    return ShareSnapshot.findOne({
      where: {
        id: snapshotId,
        shortUrl: code,
      },
      include: [
        {
          model: Editor,
          required: true,
        },
        {
          model: ShareAllowedUser,
          required: false,
        },
      ],
    })
  },

  findByCode(code: string): Promise<ShareSnapshot | null> {
    return ShareSnapshot.findOne({
      where: { shortUrl: code },
      include: [
        {
          model: Editor,
          required: true,
        },
        {
          model: ShareAllowedUser,
          required: false,
        },
      ],
    })
  },

  findLatestByEditorAndUser(editorId: string, userId: string): Promise<ShareSnapshot | null> {
    return ShareSnapshot.findOne({
      where: {
        editorId,
        userId,
      },
      order: [['createdAt', 'DESC']],
    })
  },

  async updateConfigById(input: {
    snapshotId: string
    accessMode: 'anyone' | 'specific_users'
    permissionMode: 'view' | 'edit'
    expiresAt: Date | null
  }): Promise<void> {
    await ShareSnapshot.update(
      {
        accessMode: input.accessMode,
        permissionMode: input.permissionMode,
        expiresAt: input.expiresAt,
      },
      {
        where: { id: input.snapshotId },
      },
    )
  },

  async deleteById(snapshotId: string): Promise<void> {
    await ShareSnapshot.destroy({ where: { id: snapshotId } })
  },
}
