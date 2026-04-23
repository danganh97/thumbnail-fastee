import crypto from 'crypto'
import { ShareAllowedUser } from '../models'

export const ShareAllowedUserRepository = {
  async replaceAllForSnapshot(snapshotId: string, emails: string[]): Promise<void> {
    await ShareAllowedUser.destroy({
      where: { shareSnapshotId: snapshotId },
    })
    const uniqueEmails = Array.from(new Set(emails.map(email => email.trim().toLowerCase()).filter(Boolean)))
    if (uniqueEmails.length === 0) return
    await ShareAllowedUser.bulkCreate(
      uniqueEmails.map(email => ({
        id: crypto.randomUUID(),
        shareSnapshotId: snapshotId,
        email,
      })),
    )
  },

  async isEmailAllowed(snapshotId: string, email: string): Promise<boolean> {
    const found = await ShareAllowedUser.findOne({
      where: {
        shareSnapshotId: snapshotId,
        email: email.trim().toLowerCase(),
      },
    })
    return Boolean(found)
  },

  async listEmails(snapshotId: string): Promise<string[]> {
    const rows = await ShareAllowedUser.findAll({
      where: { shareSnapshotId: snapshotId },
      attributes: ['email'],
      order: [['createdAt', 'ASC']],
    })
    return rows.map(row => row.email)
  },
}
