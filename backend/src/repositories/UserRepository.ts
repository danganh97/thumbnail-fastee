import { User } from '../models'

export const UserRepository = {
  findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } })
  },

  create(input: {
    id: string
    email: string
    name: string | null
    passwordHash?: string | null
  }): Promise<User> {
    return User.create({
      id: input.id,
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash ?? null,
    })
  },

  async updateName(id: string, name: string | null): Promise<void> {
    await User.update(
      { name },
      { where: { id } },
    )
  },
}
