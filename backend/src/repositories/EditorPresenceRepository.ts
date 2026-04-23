import crypto from 'crypto'
import { Op } from 'sequelize'
import { EditorPresence } from '../models'

export const EditorPresenceRepository = {
  async upsertPresence(input: {
    editorId: string
    sessionId: string
    userId: string | null
    displayName: string
    lastSeenAt: Date
  }): Promise<void> {
    const existing = await EditorPresence.findOne({
      where: {
        editorId: input.editorId,
        sessionId: input.sessionId,
      },
    })
    if (existing) {
      await existing.update({
        userId: input.userId,
        displayName: input.displayName,
        lastSeenAt: input.lastSeenAt,
      })
      return
    }
    await EditorPresence.create({
      id: crypto.randomUUID(),
      editorId: input.editorId,
      sessionId: input.sessionId,
      userId: input.userId,
      displayName: input.displayName,
      lastSeenAt: input.lastSeenAt,
    })
  },

  async pruneStale(editorId: string, maxAgeMs: number): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeMs)
    await EditorPresence.destroy({
      where: {
        editorId,
        lastSeenAt: {
          [Op.lt]: cutoff,
        },
      },
    })
  },

  listByEditor(editorId: string): Promise<EditorPresence[]> {
    return EditorPresence.findAll({
      where: { editorId },
      order: [['lastSeenAt', 'DESC']],
    })
  },
}
