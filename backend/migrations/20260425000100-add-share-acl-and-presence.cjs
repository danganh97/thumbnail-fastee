'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const shareDesc = await queryInterface.describeTable('share_snapshots')

    if (!shareDesc.access_mode) {
      await queryInterface.addColumn('share_snapshots', 'access_mode', {
        type: Sequelize.ENUM('anyone', 'specific_users'),
        allowNull: false,
        defaultValue: 'anyone',
      })
    }

    if (!shareDesc.permission_mode) {
      await queryInterface.addColumn('share_snapshots', 'permission_mode', {
        type: Sequelize.ENUM('view', 'edit'),
        allowNull: false,
        defaultValue: 'edit',
      })
    }

    await queryInterface.createTable('share_allowed_users', {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      share_snapshot_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'share_snapshots',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    })
    await queryInterface.addIndex('share_allowed_users', ['share_snapshot_id'], { name: 'idx_share_allowed_users_snapshot' })
    await queryInterface.addIndex('share_allowed_users', ['email'], { name: 'idx_share_allowed_users_email' })
    await queryInterface.addIndex('share_allowed_users', ['share_snapshot_id', 'email'], {
      name: 'uniq_share_allowed_users_snapshot_email',
      unique: true,
    })

    await queryInterface.createTable('editor_presence', {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      editor_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'editors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      session_id: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    })
    await queryInterface.addIndex('editor_presence', ['editor_id'], { name: 'idx_editor_presence_editor_id' })
    await queryInterface.addIndex('editor_presence', ['last_seen_at'], { name: 'idx_editor_presence_last_seen_at' })
    await queryInterface.addIndex('editor_presence', ['editor_id', 'session_id'], {
      name: 'uniq_editor_presence_editor_session',
      unique: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('editor_presence')
    await queryInterface.dropTable('share_allowed_users')
    await queryInterface.removeColumn('share_snapshots', 'permission_mode')
    await queryInterface.removeColumn('share_snapshots', 'access_mode')
  },
}
