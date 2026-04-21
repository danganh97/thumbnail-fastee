import type { Template } from '@/types'

// ── YouTube ───────────────────────────────────────────────────────────────────
import youtubeViral            from './youtube/youtube_viral.json'
import youtubeTutorial         from './youtube/youtube_tutorial.json'
import youtubeMinimal          from './youtube/youtube_minimal.json'
import youtubeShortHook        from './youtube/youtube_short_hook.json'
import youtubeShortChallenge   from './youtube/youtube_short_challenge.json'

// ── TikTok ────────────────────────────────────────────────────────────────────
import tiktokHook              from './tiktok/tiktok_hook.json'
import tiktokProduct           from './tiktok/tiktok_product.json'
import tiktokQuote             from './tiktok/tiktok_quote.json'
import tiktokLiveAnnounce      from './tiktok/tiktok_live_announce.json'
import tiktokLiveMusic         from './tiktok/tiktok_live_music.json'

// ── Facebook ──────────────────────────────────────────────────────────────────
import facebookSale            from './facebook/facebook_sale.json'
import facebookEvent           from './facebook/facebook_event.json'
import facebookMinimal         from './facebook/facebook_minimal.json'
import facebookCoverMinimal    from './facebook/facebook_cover_minimal.json'
import facebookCoverPromo      from './facebook/facebook_cover_promo.json'
import facebookStorySale       from './facebook/facebook_story_sale.json'
import facebookStoryEvent      from './facebook/facebook_story_event.json'
import facebookReelHook        from './facebook/facebook_reel_hook.json'
import facebookReelProduct     from './facebook/facebook_reel_product.json'
import facebookAvatarMinimal   from './facebook/facebook_avatar_minimal.json'

// ── Instagram ─────────────────────────────────────────────────────────────────
import instagramPostProduct    from './instagram/instagram_post_product.json'
import instagramPostQuote      from './instagram/instagram_post_quote.json'
import instagramPostMinimal    from './instagram/instagram_post_minimal.json'
import instagramReelHook       from './instagram/instagram_reel_hook.json'
import instagramReelProduct    from './instagram/instagram_reel_product.json'
import instagramStorySale      from './instagram/instagram_story_sale.json'
import instagramStoryEvent     from './instagram/instagram_story_event.json'

export const localTemplates: Template[] = [
  // YouTube Video
  youtubeViral, youtubeTutorial, youtubeMinimal,
  // YouTube Shorts
  youtubeShortHook, youtubeShortChallenge,
  // TikTok Video
  tiktokHook, tiktokProduct, tiktokQuote,
  // TikTok Live
  tiktokLiveAnnounce, tiktokLiveMusic,
  // Facebook Post
  facebookSale, facebookEvent, facebookMinimal,
  // Facebook Cover
  facebookCoverMinimal, facebookCoverPromo,
  // Facebook Story
  facebookStorySale, facebookStoryEvent,
  // Facebook Reel
  facebookReelHook, facebookReelProduct,
  // Facebook Avatar
  facebookAvatarMinimal,
  // Instagram Post
  instagramPostProduct, instagramPostQuote, instagramPostMinimal,
  // Instagram Reel
  instagramReelHook, instagramReelProduct,
  // Instagram Story
  instagramStorySale, instagramStoryEvent,
] as Template[]
