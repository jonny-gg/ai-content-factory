export type SupportedPlatform = 'douyin' | 'xiaohongshu' | 'tiktok' | 'youtube-shorts' | 'bilibili';

export function buildPlatformGuidance(platform: SupportedPlatform): string {
  switch (platform) {
    case 'douyin':
      return '抖音：前3秒必须抛钩子，字幕短句，适合60秒内完播。';
    case 'xiaohongshu':
      return '小红书：标题要像真实分享，适合图文+口播双用。';
    case 'tiktok':
      return 'TikTok：节奏更快，适合 faceless story，句子更口语化。';
    case 'youtube-shorts':
      return 'YouTube Shorts：开头强钩子，结尾要留悬念促评论。';
    case 'bilibili':
      return 'B站：可以信息更完整一点，适合剧情向短内容。';
    default:
      return '';
  }
}
