import { Request, Response } from 'express'

export const getConfig = (_req: Request, res: Response): void => {
  res.json({
    version: '1.0.0',
    fonts: ['Inter', 'Poppins', 'Bebas Neue', 'Arial', 'Georgia'],
    fontSizes: [24, 32, 40, 48, 56, 64, 72, 80, 96, 120],
    platforms: [
      { id: 'youtube',   label: 'YouTube',   icon: '▶', description: 'Video thumbnails & Shorts covers' },
      { id: 'tiktok',    label: 'TikTok',    icon: '♪', description: 'Video covers & Live banners' },
      { id: 'facebook',  label: 'Facebook',  icon: 'f', description: 'Posts, covers, stories & reels' },
      { id: 'instagram', label: 'Instagram', icon: '◈', description: 'Posts, reels & stories' },
    ],
    platformImageTypes: {
      youtube:   ['youtube_video', 'youtube_short'],
      tiktok:    ['tiktok_video', 'tiktok_live'],
      facebook:  ['facebook_post', 'facebook_cover', 'facebook_story', 'facebook_reel', 'facebook_avatar'],
      instagram: ['instagram_post', 'instagram_reel', 'instagram_story'],
    },
    imageTypes: [
      { id: 'youtube_video',   platform: 'youtube',   label: 'Video Thumbnail', width: 1280, height: 720,  description: 'Standard YouTube video thumbnail' },
      { id: 'youtube_short',   platform: 'youtube',   label: 'Shorts Cover',    width: 1080, height: 1920, description: 'YouTube Shorts cover image' },
      { id: 'tiktok_video',    platform: 'tiktok',    label: 'Video Cover',     width: 1080, height: 1920, description: 'TikTok video cover thumbnail' },
      { id: 'tiktok_live',     platform: 'tiktok',    label: 'Live Cover',      width: 1080, height: 1920, description: 'TikTok LIVE cover image' },
      { id: 'facebook_post',   platform: 'facebook',  label: 'Post / Link',     width: 1200, height: 628,  description: 'Facebook news feed post image' },
      { id: 'facebook_cover',  platform: 'facebook',  label: 'Cover Photo',     width: 851,  height: 315,  description: 'Facebook profile or page cover' },
      { id: 'facebook_story',  platform: 'facebook',  label: 'Story',           width: 1080, height: 1920, description: 'Facebook Story image' },
      { id: 'facebook_reel',   platform: 'facebook',  label: 'Reel Cover',      width: 1080, height: 1920, description: 'Facebook Reels cover thumbnail' },
      { id: 'facebook_avatar', platform: 'facebook',  label: 'Profile Avatar',  width: 800,  height: 800,  description: 'Facebook profile picture' },
      { id: 'instagram_post',  platform: 'instagram', label: 'Post',            width: 1080, height: 1080, description: 'Instagram square feed post' },
      { id: 'instagram_reel',  platform: 'instagram', label: 'Reel Cover',      width: 1080, height: 1920, description: 'Instagram Reels cover thumbnail' },
      { id: 'instagram_story', platform: 'instagram', label: 'Story',           width: 1080, height: 1920, description: 'Instagram Story image' },
    ],
  })
}
