import { Editor } from '../models'

export const EditorRepository = {
  create(input: {
    id: string
    name: string
    userId: string
    payloadJson: string
  }): Promise<Editor> {
    return Editor.create({
      id: input.id,
      name: input.name,
      userId: input.userId,
      payloadJson: input.payloadJson,
    })
  },

  async deleteByIdAndUser(editorId: string, userId: string): Promise<number> {
    return Editor.destroy({
      where: {
        id: editorId,
        userId,
      },
    })
  },

  findByIdAndUser(editorId: string, userId: string): Promise<Editor | null> {
    return Editor.findOne({
      where: {
        id: editorId,
        userId,
      },
    })
  },

  findById(editorId: string): Promise<Editor | null> {
    return Editor.findByPk(editorId)
  },

  listByUser(userId: string, limit = 20): Promise<Editor[]> {
    return Editor.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit,
    })
  },

  async updatePayload(input: {
    editorId: string
    userId: string
    payloadJson: string
    name?: string
  }): Promise<boolean> {
    const [affected] = await Editor.update(
      {
        payloadJson: input.payloadJson,
        ...(typeof input.name === 'string' ? { name: input.name } : {}),
      },
      {
        where: {
          id: input.editorId,
          userId: input.userId,
        },
      },
    )
    return affected > 0
  },
}
